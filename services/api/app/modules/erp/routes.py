from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.integrations.erp_adapter import ErpConnectionError, erp_adapter
from services.api.app.models import Customer
from services.api.app.modules.customers.routes import serialize_customer, sync_customer_to_erp

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/status")
def erp_status() -> dict:
    return erp_adapter.status()


@router.get("/customers")
def list_erp_customers() -> list[dict]:
    try:
        return erp_adapter.list_customers()
    except ErpConnectionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/customers/{customer_id}/sync")
def sync_erp_customer(customer_id: str, db: DbSession) -> dict:
    customer = db.scalar(select(Customer).where(Customer.public_id == customer_id))
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    erp_sync = sync_customer_to_erp(customer)
    db.commit()
    db.refresh(customer)
    return {"customer": serialize_customer(customer), "erp_sync": erp_sync}


@router.post("/rate")
def calculate_erp_rate(payload: dict) -> dict:
    try:
        return erp_adapter.calculate_rate(payload)
    except ErpConnectionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/estimate")
def create_erp_estimate(payload: dict) -> dict:
    try:
        return erp_adapter.create_estimate(payload)
    except ErpConnectionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/gangsheets/{gangsheet_id}/preview")
def get_erp_gangsheet_preview(gangsheet_id: str) -> dict:
    return erp_adapter.get_gangsheet_preview(gangsheet_id)
