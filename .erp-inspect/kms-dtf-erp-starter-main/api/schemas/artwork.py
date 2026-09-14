"""Web artwork, version, and approval contracts."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ArtworkModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ArtworkVersionResponse(ArtworkModel):
    id: int
    version_number: int
    original_filename: str
    file_size: int
    width: int
    height: int
    dpi_x: int
    dpi_y: int
    has_transparency: bool
    notes: str
    approval_status: str
    created_at: datetime


class ArtworkSummaryResponse(ArtworkModel):
    id: int
    title: str
    tags: tuple[str, ...]
    customer_name: str
    order_number: str
    version_count: int
    latest_version: ArtworkVersionResponse


class ArtworkDetailsResponse(ArtworkModel):
    summary: ArtworkSummaryResponse
    versions: tuple[ArtworkVersionResponse, ...]


class ApprovalPayload(BaseModel):
    status: str = Field(min_length=1, max_length=20)
    note: str = Field(default="", max_length=2000)
