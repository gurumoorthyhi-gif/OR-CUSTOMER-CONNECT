"""Typed configuration for the hosted web API."""

from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class WebSettings(BaseModel):
    """Web-only settings loaded from environment variables."""

    model_config = ConfigDict(frozen=True)

    app_name: str = "KMS DTF ERP API"
    app_env: str = "development"
    app_version: str = "0.1.0"
    api_prefix: str = "/api/v1"
    allowed_origins: tuple[str, ...] = ("http://localhost:5173",)
    database_url: str = "sqlite:///local_data/kms_dtf_erp.db"
    session_cookie_name: str = "kms_erp_session"
    csrf_cookie_name: str = "kms_erp_csrf"
    session_lifetime_hours: int = 12
    login_max_attempts: int = 5
    login_window_minutes: int = 15
    developer_mode: bool = False
    storage_provider: str = "local"
    storage_cache_directory: str = "local_data/web_storage_cache"
    local_object_directory: str = "local_data/web_object_store"
    backblaze_endpoint_url: str = ""
    backblaze_key_id: str = ""
    backblaze_application_key: str = ""
    backblaze_bucket: str = ""
    maximum_upload_mb: int = 100

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return tuple(
                origin.strip().rstrip("/")
                for origin in value.split(",")
                if origin.strip()
            )
        return value

    @model_validator(mode="after")
    def validate_web_security(self) -> WebSettings:
        if self.is_production and self.developer_mode:
            raise ValueError("Developer mode cannot be enabled in production")
        if not self.allowed_origins:
            raise ValueError("At least one allowed origin is required")
        if "*" in self.allowed_origins:
            raise ValueError("Wildcard origins are forbidden with credential cookies")
        if not 1 <= self.session_lifetime_hours <= 168:
            raise ValueError("Session lifetime must be between 1 and 168 hours")
        if not 3 <= self.login_max_attempts <= 20:
            raise ValueError("Login maximum attempts must be between 3 and 20")
        if not 1 <= self.login_window_minutes <= 60:
            raise ValueError("Login window must be between 1 and 60 minutes")
        if self.storage_provider not in {"local", "backblaze"}:
            raise ValueError("Storage provider must be local or backblaze")
        if not 1 <= self.maximum_upload_mb <= 2048:
            raise ValueError("Maximum upload size must be between 1 and 2048 MB")
        if self.storage_provider == "backblaze" and not all(
            (
                self.backblaze_endpoint_url,
                self.backblaze_key_id,
                self.backblaze_application_key,
                self.backblaze_bucket,
            )
        ):
            raise ValueError("Complete Backblaze settings are required")
        return self

    @classmethod
    def load(cls) -> WebSettings:
        values: dict[str, object] = {}
        for field_name in cls.model_fields:
            env_name = field_name.upper()
            if env_name in os.environ:
                values[field_name] = os.environ[env_name]
        return cls.model_validate(values)

    @property
    def is_production(self) -> bool:
        return self.app_env.casefold() == "production"


@lru_cache(maxsize=1)
def get_web_settings() -> WebSettings:
    return WebSettings.load()
