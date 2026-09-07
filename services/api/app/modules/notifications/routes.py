from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_notifications() -> list[dict[str, str]]:
    return [
        {"type": "approval", "title": "Gangsheet ready", "order_id": "OR-1028"},
        {"type": "payment", "title": "Estimate ready", "order_id": "OR-1028"},
    ]

