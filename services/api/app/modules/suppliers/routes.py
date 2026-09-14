from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Supplier

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_suppliers(db: DbSession) -> list[dict]:
    suppliers = db.scalars(select(Supplier).order_by(Supplier.name.asc())).all()
    return [
        {
            "id": supplier.id,
            "name": supplier.name,
            "status": supplier.status,
            "cost_per_meter": str(supplier.cost_per_meter),
        }
        for supplier in suppliers
    ]


@router.post("/jobs")
def create_supplier_job(payload: dict) -> dict:
    return {"status": "supplier_job_created", "payload": payload}
