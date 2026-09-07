from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Customer

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_customers(db: DbSession) -> list[dict]:
    customers = db.scalars(select(Customer).order_by(Customer.created_at.desc())).all()
    return [
        {
            "id": customer.public_id,
            "business_name": customer.business_name,
            "mobile": customer.mobile,
            "gst_number": customer.gst_number,
            "level": customer.level,
            "account_manager": customer.account_manager,
        }
        for customer in customers
    ]


@router.get("/{customer_id}")
def get_customer(customer_id: str, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).where(Customer.public_id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return {
        "id": customer.public_id,
        "business_name": customer.business_name,
        "mobile": customer.mobile,
        "gst_number": customer.gst_number,
        "level": customer.level,
        "account_manager": customer.account_manager,
    }
