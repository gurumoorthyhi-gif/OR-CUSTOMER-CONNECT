"""Private cloud-backed artwork storage for the hosted ERP."""

from __future__ import annotations

import mimetypes
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import uuid4

from api.config import WebSettings
from app.database import SessionFactory
from app.modules.artwork.preview import PreviewService
from app.modules.artwork.repository import ArtworkRepository
from app.modules.artwork.schemas import ArtworkDetails, StoredArtworkFile
from app.modules.artwork.service import APPROVAL_STATUSES, ArtworkService
from app.modules.cloud_storage.providers import LocalStorageProvider, S3CompatibleProvider
from app.modules.cloud_storage.service import CloudStorageService
from app.modules.customers.repository import CustomerRepository
from app.modules.orders.repository import OrderRepository

ALLOWED_EXTENSIONS = {".cdr", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}
RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}


def storage_provider(settings: WebSettings):
    if settings.storage_provider == "backblaze":
        return S3CompatibleProvider.for_backblaze(
            endpoint_url=settings.backblaze_endpoint_url,
            key_id=settings.backblaze_key_id,
            application_key=settings.backblaze_application_key,
            bucket=settings.backblaze_bucket,
        )
    return LocalStorageProvider(Path(settings.local_object_directory))


class WebArtworkService:
    def __init__(
        self,
        factory: SessionFactory,
        settings: WebSettings,
        organization_id: int,
        actor_user_id: int,
    ) -> None:
        self.factory = factory
        self.settings = settings
        self.organization_id = organization_id
        self.actor_user_id = actor_user_id
        self.repository = ArtworkRepository(factory, organization_id)
        self.cloud = CloudStorageService(
            factory,
            storage_provider(settings),
            Path(settings.storage_cache_directory),
            organization_id,
        )

    def close(self) -> None:
        self.cloud.close()

    def list(self, query: str = ""):
        return [ArtworkService._summary(item) for item in self.repository.list(query)]

    def get(self, artwork_id: int) -> ArtworkDetails:
        item = self.repository.get(artwork_id)
        if item is None:
            raise LookupError("Artwork not found")
        return ArtworkService._details(item)

    def upload(
        self,
        source: Path,
        *,
        original_filename: str,
        title: str,
        tags: tuple[str, ...],
        customer_id: int | None,
        order_id: int | None,
        notes: str,
    ) -> ArtworkDetails:
        self._validate_links(customer_id, order_id)
        stored = self._store_version(source, original_filename, 1, uuid4().hex)
        artwork = self.repository.create(
            title=title.strip() or Path(original_filename).stem,
            tags=",".join(dict.fromkeys(tag.strip().casefold() for tag in tags if tag.strip())),
            customer_id=customer_id,
            order_id=order_id,
            stored=stored,
            notes=notes.strip(),
        )
        return ArtworkService._details(artwork)

    def add_version(
        self, artwork_id: int, source: Path, original_filename: str, notes: str
    ) -> ArtworkDetails:
        artwork = self.repository.get(artwork_id)
        if artwork is None:
            raise LookupError("Artwork not found")
        version_number = max(item.version_number for item in artwork.versions) + 1
        stored = self._store_version(
            source, original_filename, version_number, f"artwork-{artwork_id}"
        )
        updated = self.repository.add_version(artwork_id, stored, notes.strip())
        if updated is None:
            raise LookupError("Artwork not found")
        return ArtworkService._details(updated)

    def approve(self, version_id: int, approval_status: str, note: str) -> ArtworkDetails:
        if approval_status not in APPROVAL_STATUSES:
            raise ValueError("Invalid artwork approval status")
        artwork_id = self.repository.add_approval(
            version_id, approval_status, note.strip(), self.actor_user_id
        )
        if artwork_id is None:
            raise LookupError("Artwork version not found")
        return self.get(artwork_id)

    def file_record(self, version_id: int, *, preview: bool):
        version = self.repository.get_version(version_id)
        if version is None:
            raise LookupError("Artwork version not found")
        file_id = version.preview_cloud_file_id if preview else version.cloud_file_id
        if file_id is None:
            message = "Preview is not available" if preview else "Original is not available"
            raise LookupError(message)
        return self.cloud.get(file_id)

    def _validate_links(self, customer_id: int | None, order_id: int | None) -> None:
        if customer_id is not None:
            customer = CustomerRepository(self.factory, self.organization_id).get(customer_id)
            if customer is None:
                raise ValueError("Customer does not belong to this organization")
        if order_id is not None:
            order = OrderRepository(self.factory, self.organization_id).get(order_id)
            if order is None:
                raise ValueError("Order does not belong to this organization")
            if customer_id is not None and order.customer_id != customer_id:
                raise ValueError("Order does not belong to the selected customer")

    def _store_version(
        self,
        source: Path,
        original_filename: str,
        version_number: int,
        artwork_key: str,
    ) -> StoredArtworkFile:
        safe_name = Path(original_filename).name
        suffix = Path(safe_name).suffix.casefold()
        if suffix not in ALLOWED_EXTENSIONS:
            raise ValueError("Supported files are CDR, PDF, PNG, JPG, WEBP, TIF, and TIFF")
        prefix = f"artwork/original/{self.organization_id}/{artwork_key}/v{version_number}"
        original = self.cloud.queue_upload(source, prefix, original_name=safe_name)
        preview_record = None
        width = height = dpi_x = dpi_y = 0
        has_transparency = False
        mime_type = mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
        if suffix in RASTER_EXTENSIONS:
            preview_path = source.with_name(f"{source.stem}-preview-{uuid4().hex}.png")
            try:
                metadata = PreviewService().create_thumbnail(source, preview_path)
                preview_record = self.cloud.queue_upload(
                    preview_path,
                    f"artwork/previews/{self.organization_id}/{artwork_key}/v{version_number}",
                    original_name=f"{Path(safe_name).stem}-preview.png",
                )
                width, height = metadata.width, metadata.height
                dpi_x, dpi_y = metadata.dpi_x, metadata.dpi_y
                has_transparency = metadata.has_transparency
                mime_type = metadata.mime_type
            finally:
                preview_path.unlink(missing_ok=True)
        return StoredArtworkFile(
            original_filename=safe_name,
            original_path=original.object_key,
            preview_path=preview_record.object_key if preview_record else "",
            mime_type=mime_type,
            file_size=original.size_bytes,
            width=width,
            height=height,
            dpi_x=dpi_x,
            dpi_y=dpi_y,
            has_transparency=has_transparency,
            checksum_sha256=original.checksum_sha256,
            cloud_file_id=original.id,
            preview_cloud_file_id=preview_record.id if preview_record else None,
        )


def save_upload_to_temporary(upload, maximum_bytes: int) -> Path:
    suffix = Path(upload.filename or "upload").suffix.casefold()
    with NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
        total = 0
        while chunk := upload.file.read(1024 * 1024):
            total += len(chunk)
            if total > maximum_bytes:
                path = Path(temporary.name)
                temporary.close()
                path.unlink(missing_ok=True)
                raise ValueError("Uploaded file is too large")
            temporary.write(chunk)
        return Path(temporary.name)
