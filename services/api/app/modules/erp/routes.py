from fastapi import APIRouter, HTTPException

from services.api.app.integrations.erp_adapter import ErpConnectionError, erp_adapter

router = APIRouter()


@router.get("/status")
def erp_status() -> dict:
    return erp_adapter.status()


@router.get("/customers")
def list_erp_customers() -> list[dict]:
    try:
        return erp_adapter.list_customers()
    except ErpConnectionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


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
