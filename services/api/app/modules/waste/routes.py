from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import ProductionJob, WasteEvent

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_waste_events(db: DbSession) -> list[dict]:
    events = db.scalars(select(WasteEvent).order_by(WasteEvent.id.desc())).all()
    rows = []
    for event in events:
        job = db.get(ProductionJob, event.production_job_id)
        rows.append(
            {
                "id": event.id,
                "job_id": job.public_id if job else str(event.production_job_id),
                "category": event.category,
                "meters": str(event.meters),
                "notes": event.notes,
            }
        )
    return rows


@router.post("")
def record_waste(payload: dict, db: DbSession) -> dict:
    job = db.scalar(select(ProductionJob).where(ProductionJob.public_id == payload.get("job_id")))
    if job:
        event = WasteEvent(
            production_job_id=job.id,
            category=payload.get("category", "unspecified"),
            meters=Decimal(str(payload.get("meters", "0"))),
            notes=payload.get("notes"),
        )
        db.add(event)
        db.commit()
    return {"status": "waste_recorded", "payload": payload, "audit": "recorded"}
