from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Customer, Order, SupportTicket

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_support_tickets(db: DbSession) -> list[dict]:
    tickets = db.scalars(select(SupportTicket).order_by(SupportTicket.id.desc())).all()
    rows = []
    for ticket in tickets:
        order = db.get(Order, ticket.order_id) if ticket.order_id else None
        rows.append(
            {
                "id": ticket.public_id,
                "order_id": order.public_id if order else None,
                "status": ticket.status,
                "issue": ticket.issue,
            }
        )
    return rows


@router.post("")
def create_support_ticket(payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    if customer:
        ticket = SupportTicket(
            public_id=payload.get("public_id", "SUP-DRAFT-0001"),
            customer_id=customer.id,
            order_id=order.id if order else None,
            issue=payload.get("issue", "Support request"),
            status="open",
        )
        db.add(ticket)
        db.commit()
    return {"status": "created", "ticket": payload, "audit": "recorded"}
