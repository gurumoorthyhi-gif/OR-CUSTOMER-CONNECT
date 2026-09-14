from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Order, Shipment

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_packing_items(db: DbSession) -> list[dict]:
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


@router.post("/{packing_id}/complete")
def complete_packing(packing_id: str, db: DbSession) -> dict[str, str]:
    shipment = db.scalar(select(Shipment).where(Shipment.public_id == packing_id))
    if shipment:
        shipment.status = "packed"
        db.commit()
    return {"packing_id": packing_id, "status": "packed", "audit": "recorded"}
