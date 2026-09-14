from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Customer, CustomerOrderStatus, Order

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_orders(db: DbSession) -> list[dict]:
    orders = db.scalars(select(Order).order_by(Order.created_at.desc())).all()
    return [
        {
            "id": order.public_id,
            "title": order.title,
            "status": order.status.value,
            "meters": str(order.total_meters),
            "rate_per_meter": str(order.rate_per_meter),
            "amount": str(order.price_snapshot),
            "payment_status": order.payment_status,
            "external_erp_id": order.external_erp_id,
        }
        for order in orders
    ]


@router.post("")
def create_order(payload: dict, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).order_by(Customer.id.asc()))
    if customer is None:
        customer = Customer(
            public_id="OR-TN-0001",
            business_name="New Customer",
            mobile="+910000000000",
        )
        db.add(customer)
        db.flush()

    order = Order(
        public_id=payload.get("public_id", "OR-DRAFT-0001"),
        customer_id=customer.id,
        title=payload.get("title", "Draft DTF order"),
        status=CustomerOrderStatus.RECEIVED,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"id": order.public_id, "status": order.status.value}
