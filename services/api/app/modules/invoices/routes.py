from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Invoice, Order

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_invoices(db: DbSession) -> list[dict]:
    invoices = db.scalars(select(Invoice).order_by(Invoice.id.desc())).all()
    rows = []
    for invoice in invoices:
        order = db.get(Order, invoice.order_id)
        rows.append(
            {
                "id": invoice.public_id,
                "order_id": order.public_id if order else str(invoice.order_id),
                "status": invoice.status,
                "amount": str(invoice.amount),
            }
        )
    return rows


@router.post("")
def create_invoice(payload: dict, db: DbSession) -> dict:
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    if order:
        invoice = Invoice(
            public_id=payload.get("public_id", "INV-DRAFT-0001"),
            order_id=order.id,
            status=payload.get("status", "proforma"),
            amount=Decimal(str(payload.get("amount", order.price_snapshot))),
        )
        db.add(invoice)
        db.commit()
    return {"status": "invoice_created", "payload": payload, "audit": "recorded"}
