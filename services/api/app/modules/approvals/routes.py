from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Approval, CustomerOrderStatus, Order

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_approvals(db: DbSession) -> list[dict]:
    approvals = db.scalars(select(Approval).order_by(Approval.id.desc())).all()
    rows = []
    for approval in approvals:
        order = db.get(Order, approval.order_id)
        rows.append(
            {
                "id": approval.id,
                "order_id": order.public_id if order else str(approval.order_id),
                "status": approval.status,
                "gangsheet_version": approval.gangsheet_version,
                "reason": approval.reason,
                "source": "erp_adapter_ready",
            }
        )
    return rows


@router.post("/{order_id}/approve")
def approve_order(order_id: str, db: DbSession) -> dict[str, str]:
    order = db.scalar(select(Order).where(Order.public_id == order_id))
    if order:
        approval = db.scalar(select(Approval).where(Approval.order_id == order.id))
        if approval:
            approval.status = "approved"
            approval.decided_at = datetime.now(UTC)
        order.status = CustomerOrderStatus.AWAITING_PAYMENT
        db.commit()
    return {"order_id": order_id, "status": "approved", "audit": "recorded"}


@router.post("/{order_id}/reject")
def reject_order(order_id: str, payload: dict, db: DbSession) -> dict[str, str]:
    order = db.scalar(select(Order).where(Order.public_id == order_id))
    reason = payload.get("reason", "")
    if order:
        approval = db.scalar(select(Approval).where(Approval.order_id == order.id))
        if approval:
            approval.status = "change_requested"
            approval.reason = reason
            approval.decided_at = datetime.now(UTC)
        order.status = CustomerOrderStatus.ARTWORK_CHECKING
        db.commit()
    return {"order_id": order_id, "status": "change_requested", "reason": reason}
