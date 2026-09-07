from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import ProductionJob, QualityCheck

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_qc_items(db: DbSession) -> list[dict]:
    items = db.scalars(select(QualityCheck).order_by(QualityCheck.id.asc())).all()
    rows = []
    for item in items:
        job = db.get(ProductionJob, item.production_job_id)
        rows.append(
            {
                "id": item.id,
                "job_id": job.public_id if job else str(item.production_job_id),
                "status": item.status,
                "defect": item.defect_reason,
                "checked_by": item.checked_by,
            }
        )
    return rows


@router.post("/{qc_id}/pass")
def pass_qc(qc_id: int, db: DbSession) -> dict[str, str | int]:
    item = db.get(QualityCheck, qc_id)
    if item:
        item.status = "passed"
        item.defect_reason = None
        db.commit()
    return {"qc_id": qc_id, "status": "passed", "audit": "recorded"}


@router.post("/{qc_id}/reject")
def reject_qc(qc_id: int, payload: dict, db: DbSession) -> dict:
    item = db.get(QualityCheck, qc_id)
    reason = payload.get("reason", "unspecified")
    if item:
        item.status = "rejected"
        item.defect_reason = reason
        db.commit()
    return {"qc_id": qc_id, "status": "rejected", "reason": reason, "reprint_required": True}
