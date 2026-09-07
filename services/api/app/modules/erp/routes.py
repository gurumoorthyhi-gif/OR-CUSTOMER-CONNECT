from fastapi import APIRouter

from services.api.app.integrations.erp_adapter import erp_adapter

router = APIRouter()


@router.get("/customers")
def list_erp_customers() -> list[dict]:
    return erp_adapter.list_customers()


@router.post("/rate")
def calculate_erp_rate(payload: dict) -> dict:
    return erp_adapter.calculate_rate(payload)


@router.post("/estimate")
def create_erp_estimate(payload: dict) -> dict:
    return erp_adapter.create_estimate(payload)


@router.get("/gangsheets/{gangsheet_id}/preview")
def get_erp_gangsheet_preview(gangsheet_id: str) -> dict:
    return erp_adapter.get_gangsheet_preview(gangsheet_id)

