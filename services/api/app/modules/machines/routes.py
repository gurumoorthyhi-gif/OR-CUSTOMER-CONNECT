from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.api.app.db.session import get_db
from services.api.app.models import Machine

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get("")
def list_machines(db: DbSession) -> list[dict]:
    machines = db.scalars(select(Machine).order_by(Machine.name.asc())).all()
    return [
        {
            "id": machine.id,
            "name": machine.name,
            "status": machine.status,
            "width_inches": str(machine.width_inches),
            "speed_mph": str(machine.speed_mph),
        }
        for machine in machines
    ]


@router.post("/{machine_id}/status")
def update_machine_status(machine_id: int, payload: dict, db: DbSession) -> dict:
    machine = db.get(Machine, machine_id)
    status = payload.get("status", "available")
    if machine:
        machine.status = status
        db.commit()
    return {"machine_id": machine_id, "status": status}
