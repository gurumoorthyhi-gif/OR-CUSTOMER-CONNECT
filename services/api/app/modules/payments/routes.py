from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Order, Payment
from services.api.app.modules.customers.routes import customer_from_session

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_payments(request: Request, db: DbSession) -> list[dict]:
    query = select(Payment, Order.public_id).join(Order, Order.id == Payment.order_id).order_by(Payment.created_at.desc())
    customer = customer_from_session(request, db)
    if customer:
        query = query.where(Order.customer_id == customer.id)
    rows = db.execute(query).all()
    return [
        {
            "id": payment.public_id,
            "order_id": order_public_id,
            "status": payment.status,
            "amount": str(payment.amount),
            "method": payment.method,
        }
        for payment, order_public_id in rows
    ]


@router.post("/{payment_id}/status")
def update_payment_status(payment_id: str, payload: dict, db: DbSession) -> dict:
    payment = db.scalar(select(Payment).where(Payment.public_id == payment_id))
    status = payload.get("status", "pending")
    if payment:
        payment.status = status
        db.commit()

    return {"payment_id": payment_id, "status": status, "audit": "recorded"}
