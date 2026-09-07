from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "ODD RAVEN"
    environment: str = "local"
    database_url: str = "sqlite:///./oddraven-local.db"
    redis_url: str = "redis://localhost:6379/0"
    object_storage_bucket: str = "oddraven-local"
    jwt_secret: str = "change-me"
    cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000"
    kms_erp_base_url: str = "http://127.0.0.1:8001/api/v1"
    kms_erp_username: str = ""
    kms_erp_password: str = ""
    kms_erp_organization_slug: str = ""
    kms_erp_timeout_seconds: float = 5.0


settings = Settings()
