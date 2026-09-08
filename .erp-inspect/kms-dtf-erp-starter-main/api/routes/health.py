"""Operational health endpoints."""

from fastapi import APIRouter, Request

from api.config import WebSettings
from api.schemas.health import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Check API availability")
def health(request: Request) -> HealthResponse:
    settings: WebSettings = request.app.state.settings
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
    )
