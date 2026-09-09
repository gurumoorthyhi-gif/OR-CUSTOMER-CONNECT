from datetime import datetime
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.core.config import settings
from services.api.app.db.session import get_db
from services.api.app.models import Customer, Design, ImageProcessingJob

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
PROCESSING_DIR = Path("local_uploads/image-processing")
PROCESSING_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_OPERATIONS = {"REMOVE_BG", "UPSCALE_2X", "UPSCALE_4X"}


def serialize_job(job: ImageProcessingJob) -> dict:
    return {
        "jobId": job.job_id,
        "operation": job.operation,
        "status": job.status,
        "result": {"imageUrl": job.result_file_path} if job.status == "COMPLETED" and job.result_file_path else None,
        "error": "Image processing could not be completed. Please try again." if job.status == "FAILED" else None,
    }


async def create_job(db: DbSession, operation: str, upload: UploadFile, design_id: int | None = None) -> dict:
    if operation not in ALLOWED_OPERATIONS:
        raise HTTPException(status_code=422, detail="Unsupported image processing operation")
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="An image file is required")
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    design = db.get(Design, design_id) if design_id else None
    if design_id and design is None:
        raise HTTPException(status_code=404, detail="Design not found")
    job_id = str(uuid4())
    suffix = Path(upload.filename or "image.png").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}:
        suffix = ".png"
    source = PROCESSING_DIR / f"{job_id}-source{suffix}"
    max_bytes = settings.max_image_upload_mb * 1024 * 1024
    content = await upload.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds the configured upload limit")
    try:
        with Image.open(__import__("io").BytesIO(content)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError, SyntaxError):
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid image") from None
    source.write_bytes(content)
    job = ImageProcessingJob(
        job_id=job_id,
        customer_id=customer.id if customer else None,
        design_id=design.id if design else None,
        operation=operation,
        status="QUEUED" if settings.pixelcut_enabled else "FAILED",
        source_file_path=str(source),
        max_attempts=settings.pixelcut_max_attempts,
        error_code=None if settings.pixelcut_enabled else "PIXELCUT_DISABLED",
        error_message=None if settings.pixelcut_enabled else "Pixelcut browser workers are not enabled",
        updated_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return serialize_job(job)


@router.post("/upload")
async def create_upload_job(
    db: DbSession,
    operation: Annotated[str, Form()],
    upload: Annotated[UploadFile, File()],
) -> dict:
    return await create_job(db, operation.upper(), upload)


@router.post("/designs/{design_id}/remove-background")
async def remove_background(design_id: int, db: DbSession, upload: Annotated[UploadFile, File()]) -> dict:
    return await create_job(db, "REMOVE_BG", upload, design_id)


@router.post("/designs/{design_id}/upscale")
async def upscale(design_id: int, db: DbSession, scale: Annotated[int, Form()], upload: Annotated[UploadFile, File()]) -> dict:
    if scale not in {2, 4}:
        raise HTTPException(status_code=422, detail="Scale must be 2 or 4")
    return await create_job(db, f"UPSCALE_{scale}X", upload, design_id)


@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: DbSession) -> dict:
    job = db.scalar(select(ImageProcessingJob).where(ImageProcessingJob.job_id == job_id))
    if job is None:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return serialize_job(job)


@router.get("/health")
def processing_health(db: DbSession) -> dict:
    from services.api.app.modules.image_processing.workers import worker_manager
    queued = db.scalars(select(ImageProcessingJob).where(ImageProcessingJob.status == "QUEUED")).all()
    return {
        "enabled": settings.pixelcut_enabled,
        "background": {"configuredWorkers": settings.pixelcut_bg_workers, "queueLength": sum(job.operation == "REMOVE_BG" for job in queued)},
        "upscale": {"configuredWorkers": settings.pixelcut_upscale_workers, "queueLength": sum(job.operation.startswith("UPSCALE") for job in queued)},
        "workers": worker_manager.registry,
    }
