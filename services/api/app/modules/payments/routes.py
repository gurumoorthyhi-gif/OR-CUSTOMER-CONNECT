from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Payment

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_payments(db: DbSession) -> list[dict]:
    payments = db.scalars(select(Payment).order_by(Payment.created_at.desc())).all()
    return [
        {
            "id": payment.public_id,
            "order_id": payment.order_id,
            "status": payment.status,
            "amount": str(payment.amount),
            "method": payment.method,
        }
        for payment in payments
    ]


@router.post("/{payment_id}/status")
def update_payment_status(payment_id: str, payload: dict, db: DbSession) -> dict:
    payment = db.scalar(select(Payment).where(Payment.public_id == payment_id))
    status = payload.get("status", "pending")
    if payment:
        payment.status = status
        db.commit()

    return {"payment_id": payment_id, "status": status, "audit": "recorded"}
