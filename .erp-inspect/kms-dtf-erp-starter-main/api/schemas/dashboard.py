"""Browser dashboard response contracts matching the desktop overview."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class DashboardMetricsResponse(BaseModel):
    todays_orders: int
    pending_orders: int
    in_production: int
    completed_jobs: int
    pending_payments: int
    revenue: Decimal


class PipelineStageResponse(BaseModel):
    name: str
    count: int


class ActivityItemResponse(BaseModel):
    action: str
    details: str
    occurred_at: datetime


class LowStockItemResponse(BaseModel):
    name: str
    available: Decimal
    reorder_level: Decimal
    unit: str


class DashboardOverviewResponse(BaseModel):
    metrics: DashboardMetricsResponse
    pipeline: list[PipelineStageResponse]
    recent_activity: list[ActivityItemResponse]
    low_stock: list[LowStockItemResponse]
