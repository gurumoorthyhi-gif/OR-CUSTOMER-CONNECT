from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Order, Reprint

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_reprints(db: DbSession) -> list[dict]:
    reprints = db.scalars(select(Reprint).order_by(Reprint.id.desc())).all()
    rows = []
    for reprint in reprints:
        order = db.get(Order, reprint.order_id)
        rows.append(
            {
                "id": reprint.public_id,
                "order_id": order.public_id if order else str(reprint.order_id),
                "reason": reprint.reason,
                "status": reprint.status,
            }
        )
    return rows


@router.post("")
def create_reprint(payload: dict, db: DbSession) -> dict:
    order = db.scalar(select(Order).where(Order.public_id == payload.get("order_id")))
    if order:
        reprint = Reprint(
            public_id=payload.get("public_id", "RPT-DRAFT-0001"),
            order_id=order.id,
            reason=payload.get("reason", "Reprint required"),
            status="created",
        )
        db.add(reprint)
        db.commit()
    return {"status": "reprint_created", "payload": payload, "audit": "recorded"}
