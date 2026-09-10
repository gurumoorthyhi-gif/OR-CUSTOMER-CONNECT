import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from time import monotonic

from PIL import Image
from sqlalchemy import select

from services.api.app.core.config import settings
from services.api.app.db.session import SessionLocal
from services.api.app.models import ImageProcessingJob
from services.api.app.modules.image_processing.pixelcut import PixelcutBrowserProvider
from services.api.app.modules.image_processing.readiness import error_code, error_message
from services.api.app.modules.image_processing.routes import PROCESSING_DIR

logger = logging.getLogger(__name__)


def trim_transparent_pixels(source: Path, destination: Path) -> None:
    """Crop only fully transparent outer pixels from a processed PNG."""
    with Image.open(source) as image:
        if "A" not in image.getbands():
            image.save(destination, format="PNG")
            return
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if not bounds:
            # Keep an all-transparent result valid without creating a 0x0 image.
            image.save(destination, format="PNG")
            return
        image.crop(bounds).save(destination, format="PNG")


class PixelcutWorkerManager:
    def __init__(self) -> None:
        self.tasks: list[asyncio.Task] = []
        self.stopping = False
        self.claim_lock = asyncio.Lock()
        self.registry: dict[str, dict] = {}

    async def start(self) -> None:
        self.stopping = False
        if not settings.pixelcut_enabled:
            return
        self._recover_stale_jobs()
        for index in range(settings.pixelcut_bg_workers):
            worker_id = f"BG-{index + 1:02d}"
            self.tasks.append(asyncio.create_task(self._run_worker(worker_id, "background")))
        for index in range(settings.pixelcut_upscale_workers):
            worker_id = f"UP-{index + 1:02d}"
            self.tasks.append(asyncio.create_task(self._run_worker(worker_id, "upscale")))

    async def stop(self) -> None:
        self.stopping = True
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks.clear()

    def _recover_stale_jobs(self) -> None:
        cutoff = datetime.utcnow() - timedelta(minutes=settings.job_stale_minutes)
        with SessionLocal() as db:
            jobs = db.scalars(select(ImageProcessingJob).where(
                ImageProcessingJob.status == "PROCESSING",
                ImageProcessingJob.started_at < cutoff,
            )).all()
            for job in jobs:
                job.status = "QUEUED" if job.attempt_count < job.max_attempts else "FAILED"
                job.worker_id = None
                job.updated_at = datetime.utcnow()
            db.commit()

    async def _claim(self, worker_id: str, worker_type: str) -> str | None:
        async with self.claim_lock:
            with SessionLocal() as db:
                statement = select(ImageProcessingJob).where(ImageProcessingJob.status == "QUEUED")
                if worker_type == "background":
                    statement = statement.where(ImageProcessingJob.operation == "REMOVE_BG")
                else:
                    statement = statement.where(ImageProcessingJob.operation.in_(("UPSCALE_2X", "UPSCALE_4X")))
                job = db.scalar(statement.order_by(ImageProcessingJob.priority.asc(), ImageProcessingJob.queued_at.asc()))
                if not job:
                    return None
                job.status = "PROCESSING"
                job.worker_id = worker_id
                job.started_at = datetime.utcnow()
                job.attempt_count += 1
                job.updated_at = datetime.utcnow()
                db.commit()
                return job.job_id

    async def _run_worker(self, worker_id: str, worker_type: str) -> None:
        provider = PixelcutBrowserProvider(worker_id)
        self.registry[worker_id] = {"type": worker_type, "state": "STARTING", "currentJob": None, "lastError": None, "jobsProcessed": 0}
        try:
            await provider.start()
            last_connection_check = 0.0
            while not self.stopping:
                if self.registry[worker_id]["state"] not in {"AVAILABLE", "BUSY"} or monotonic() - last_connection_check >= 30:
                    try:
                        await provider.check_connection(worker_type)
                        last_connection_check = monotonic()
                        self.registry[worker_id].update(state="AVAILABLE", lastError=None)
                    except Exception as exc:
                        code = error_code(exc)
                        logger.warning("Worker %s connection unavailable: %s", worker_id, code, exc_info=code != "NETWORK_ACCESS_DENIED")
                        self.registry[worker_id].update(state="UNHEALTHY", lastError=code, currentJob=None)
                        await asyncio.sleep(30)
                        continue
                job_id = await self._claim(worker_id, worker_type)
                if not job_id:
                    await asyncio.sleep(1)
                    continue
                self.registry[worker_id].update(state="BUSY", currentJob=job_id)
                await self._process_job(provider, worker_id, job_id)
                if self.registry[worker_id]["state"] == "BUSY":
                    self.registry[worker_id].update(state="AVAILABLE", currentJob=None)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            self.registry[worker_id].update(state="UNHEALTHY", lastError=error_code(exc))
        finally:
            await provider.close()
            if self.registry[worker_id]["state"] != "BLOCKED":
                self.registry[worker_id]["state"] = "STOPPED"

    async def _process_job(self, provider: PixelcutBrowserProvider, worker_id: str, job_id: str) -> None:
        with SessionLocal() as db:
            job = db.scalar(select(ImageProcessingJob).where(ImageProcessingJob.job_id == job_id))
            if not job:
                return
            source = Path(job.source_file_path)
            operation = job.operation
            output_dir = Path("runtime/pixelcut/jobs") / job_id / "output"
            output_dir.mkdir(parents=True, exist_ok=True)
            output = output_dir / ("result.png" if operation == "REMOVE_BG" else "result.jpg")
        try:
            await provider.process(source, operation, output)
            with Image.open(output) as result:
                result.verify()
            permanent = PROCESSING_DIR / f"{job_id}-result{output.suffix}"
            if operation == "REMOVE_BG":
                trim_transparent_pixels(output, permanent)
            else:
                permanent.write_bytes(output.read_bytes())
            with Image.open(permanent) as result:
                result.verify()
            with SessionLocal() as db:
                job = db.scalar(select(ImageProcessingJob).where(ImageProcessingJob.job_id == job_id))
                if job:
                    job.status = "COMPLETED"
                    job.result_file_path = f"/api/image-processing/files/{permanent.name}"
                    job.completed_at = datetime.utcnow()
                    job.updated_at = datetime.utcnow()
                    db.commit()
            self.registry[worker_id]["jobsProcessed"] += 1
            self.registry[worker_id]["lastError"] = None
        except Exception as exc:
            logger.exception("Worker %s could not start", worker_id)
            logger.exception("Pixelcut processing failed for job %s (%s)", job_id, operation)
            code = error_code(exc)
            with SessionLocal() as db:
                job = db.scalar(select(ImageProcessingJob).where(ImageProcessingJob.job_id == job_id))
                if job:
                    retryable = code not in {"ACCESS_RESTRICTED", "CAPTCHA_DETECTED", "PIXELCUT_SELECTOR_NOT_FOUND"}
                    job.status = "QUEUED" if retryable and job.attempt_count < job.max_attempts else "FAILED"
                    job.worker_id = None
                    job.error_code = code
                    job.error_message = error_message(code)
                    job.updated_at = datetime.utcnow()
                    db.commit()
            self.registry[worker_id]["lastError"] = code
            self.registry[worker_id].update(state="UNHEALTHY", currentJob=None)


worker_manager = PixelcutWorkerManager()
