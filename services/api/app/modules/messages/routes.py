from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Customer, Message, Order

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_messages(db: DbSession) -> list[dict]:
    messages = db.scalars(select(Message).order_by(Message.created_at.asc())).all()
    return [
        {
            "id": message.id,
            "customer_id": message.customer_id,
            "order_id": message.order_id,
            "sender_type": message.sender_type,
            "body": message.body,
            "created_at": message.created_at.isoformat(),
        }
        for message in messages
    ]


@router.post("")
def send_message(payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    if customer:
        message = Message(
            customer_id=customer.id,
            order_id=order.id if order else None,
            sender_type=payload.get("sender_type", "customer"),
            body=payload.get("body", ""),
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return {"status": "sent", "id": message.id, "audit": "recorded"}
    return {"status": "failed", "reason": "no_customer"}
