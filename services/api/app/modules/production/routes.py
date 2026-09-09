from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Machine, Order, ProductionJob

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/queue")
def production_queue(db: DbSession) -> list[dict]:
    jobs = db.scalars(select(ProductionJob).order_by(ProductionJob.id.asc())).all()
    rows = []
    for job in jobs:
        order = db.get(Order, job.order_id)
        machine = db.get(Machine, job.machine_id) if job.machine_id else None
        rows.append(
            {
                "id": job.public_id,
                "order_id": order.public_id if order else str(job.order_id),
                "machine": machine.name if machine else "Awaiting assignment",
                "operator": job.operator_name,
                "status": job.status,
                "expected_meters": str(job.expected_meters),
                "actual_meters": str(job.actual_meters),
                "waste_meters": str(job.waste_meters),
            }
        )
    return rows
