from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Design

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_designs(db: DbSession) -> list[dict]:
    designs = db.scalars(select(Design).order_by(Design.created_at.desc())).all()
    return [
        {
            "id": design.id,
            "external_erp_id": design.external_erp_id,
            "name": design.name,
            "storage_key": design.storage_key,
            "preview_key": design.preview_key,
            "notes": design.notes,
        }
        for design in designs
    ]


@router.post("/upload")
def upload_design(payload: dict) -> dict:
    return {"status": "upload_pending_erp_adapter", "payload": payload}
