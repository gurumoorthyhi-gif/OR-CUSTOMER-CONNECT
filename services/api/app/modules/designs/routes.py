from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select

from services.api.app.db.session import get_db
from services.api.app.core.config import settings
from services.api.app.models import Customer, Design
from services.api.app.modules.customers.routes import customer_from_session

router = APIRouter()
DbSession = Annotated[object, Depends(get_db)]
DESIGN_DIR = Path("local_uploads/designs")
DESIGN_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}


def serialize_design(design: Design) -> dict:
    preview_source = Path(design.preview_key or design.storage_key)
    version = preview_source.stat().st_mtime_ns if preview_source.exists() else 0
    return {"id": design.id, "external_erp_id": design.external_erp_id, "name": design.name, "storage_key": design.storage_key, "preview_key": design.preview_key, "notes": design.notes, "file_url": f"/api/designs/{design.id}/file", "preview_url": f"/api/designs/{design.id}/preview?v={version}", "created_at": design.created_at.isoformat() if design.created_at else None}


def owned_design(request: Request, design: Design, db) -> bool:
    customer = customer_from_session(request, db)
    return customer is None or design.customer_id == customer.id


@router.get("")
def list_designs(request: Request, db: DbSession) -> list[dict]:
    query = select(Design).order_by(Design.created_at.desc())
    customer = customer_from_session(request, db)
    if customer:
        query = query.where(Design.customer_id == customer.id)
    return [serialize_design(design) for design in db.scalars(query).all()]


@router.get("/{design_id}")
def get_design(design_id: int, request: Request, db: DbSession) -> dict:
    design = db.get(Design, design_id)
    if not design or not owned_design(request, design, db):
        raise HTTPException(status_code=404, detail="Design not found")
    return serialize_design(design)


@router.post("/upload")
async def upload_design(request: Request, db: DbSession, upload: Annotated[UploadFile, File(...)]) -> dict:
    customer = customer_from_session(request, db)
    if not customer and settings.environment == "local":
        customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
        if customer is None:
            customer = Customer(public_id="OR-LOCAL-0001", business_name="Local Customer", mobile="+910000000000")
            db.add(customer); db.commit(); db.refresh(customer)
    if not customer:
        raise HTTPException(status_code=401, detail="Customer login required")
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload an image file")
    suffix = Path(upload.filename or "design.png").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Supported formats: PNG, JPG, WEBP, TIF, TIFF")
    content = await upload.read(100 * 1024 * 1024 + 1)
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Design must be 100 MB or smaller")
    filename = f"{uuid4().hex}{suffix}"
    path = DESIGN_DIR / filename
    path.write_bytes(content)
    design = Design(customer_id=customer.id, name=upload.filename or "Untitled design", storage_key=str(path), preview_key=str(path), notes="Uploaded from customer design library")
    db.add(design); db.commit(); db.refresh(design)
    return {"status": "uploaded", "design": serialize_design(design)}


@router.patch("/{design_id}")
def update_design(design_id: int, request: Request, payload: dict, db: DbSession) -> dict:
    design = db.get(Design, design_id)
    if not design or not owned_design(request, design, db):
        raise HTTPException(status_code=404, detail="Design not found")
    if payload.get("name"):
        design.name = str(payload["name"]).strip()[:180]
    if "notes" in payload:
        design.notes = str(payload.get("notes") or "")[:2000]
    preview_url = str(payload.get("preview_url") or "")
    if preview_url.startswith("/api/image-processing/files/"):
        candidate = Path("local_uploads/image-processing") / Path(preview_url).name
        if candidate.exists():
            design.preview_key = str(candidate)
    db.commit(); db.refresh(design)
    return {"status": "updated", "design": serialize_design(design)}


@router.delete("/{design_id}")
def delete_design(design_id: int, request: Request, db: DbSession) -> dict:
    design = db.get(Design, design_id)
    if not design or not owned_design(request, design, db):
        raise HTTPException(status_code=404, detail="Design not found")
    for key in {design.storage_key, design.preview_key}:
        if key:
            Path(key).unlink(missing_ok=True)
    db.delete(design); db.commit()
    return {"status": "deleted", "id": design_id}


def _serve_design(design_id: int, request: Request, db, inline: bool) -> FileResponse:
    design = db.get(Design, design_id)
    if not design or not owned_design(request, design, db) or not Path(design.storage_key).exists():
        raise HTTPException(status_code=404, detail="Design file not found")
    source = design.preview_key if inline and design.preview_key else design.storage_key
    if not Path(source).exists():
        raise HTTPException(status_code=404, detail="Design file not found")
    return FileResponse(source, filename=design.name, content_disposition_type="inline" if inline else "attachment")


@router.get("/{design_id}/file")
def design_file(design_id: int, request: Request, db: DbSession) -> FileResponse:
    return _serve_design(design_id, request, db, False)


@router.get("/{design_id}/preview")
def design_preview(design_id: int, request: Request, db: DbSession) -> FileResponse:
    return _serve_design(design_id, request, db, True)
