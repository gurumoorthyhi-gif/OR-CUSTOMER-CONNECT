from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Order, Shipment

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_shipments(db: DbSession) -> list[dict]:
    shipments = db.scalars(select(Shipment).order_by(Shipment.id.asc())).all()
    rows = []
    for shipment in shipments:
        order = db.get(Order, shipment.order_id)
        rows.append(
            {
                "id": shipment.public_id,
                "order_id": order.public_id if order else str(shipment.order_id),
                "status": shipment.status,
                "courier": shipment.courier,
                "awb": shipment.awb,
            }
        )
    return rows


@router.post("")
def create_shipment(payload: dict, db: DbSession) -> dict:
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    if order:
        shipment = Shipment(
            public_id=payload.get("public_id", "SHP-DRAFT-0001"),
            order_id=order.id,
            courier=payload.get("courier", "manual"),
            awb=payload.get("awb"),
            status=payload.get("status", "packing_pending"),
        )
        db.add(shipment)
        db.commit()
    return {"status": "shipment_created", "payload": payload, "source": "manual_until_api"}
