"""Tenant-scoped browser dashboard matching the desktop dashboard contract."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from api.authentication import WebAuthContext, require_permission
from api.schemas.dashboard import DashboardOverviewResponse
from app.modules.dashboard import DashboardPeriod, DashboardRepository, DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOverviewResponse)
def dashboard_overview(
    request: Request,
    period: str = Query(default=DashboardPeriod.TODAY.value),
    context: WebAuthContext = Depends(require_permission("dashboard.view")),
):
    try:
        selected_period = DashboardPeriod(period)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid dashboard period") from exc
    repository = DashboardRepository(
        request.app.state.session_factory,
        context.organization_id,
    )
    return DashboardService(repository).get_overview(selected_period)
