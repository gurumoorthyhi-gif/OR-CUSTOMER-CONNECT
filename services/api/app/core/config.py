from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "ODD RAVEN"
    environment: str = "local"
    database_url: str = "sqlite:///./oddraven-local.db"
    redis_url: str = "redis://localhost:6379/0"
    object_storage_bucket: str = "oddraven-local"
    jwt_secret: str = "change-me"
    cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3010,http://localhost:3010,http://127.0.0.1:3011,http://localhost:3011"
    kms_erp_base_url: str = "http://127.0.0.1:8001/api/v1"
    kms_erp_username: str = ""
    kms_erp_password: str = ""
    kms_erp_organization_slug: str = ""
    kms_erp_timeout_seconds: float = 5.0
    pixelcut_enabled: bool = False
    pixelcut_bg_url: str = "https://www.pixelcut.ai/background-remover"
    pixelcut_upscale_url: str = "https://www.pixelcut.ai/image-upscaler"
    pixelcut_headless: bool = True
    pixelcut_bg_workers: int = 5
    pixelcut_upscale_workers: int = 5
    pixelcut_navigation_timeout_ms: int = 45000
    pixelcut_upload_timeout_ms: int = 60000
    pixelcut_process_timeout_ms: int = 180000
    pixelcut_download_timeout_ms: int = 60000
    pixelcut_max_attempts: int = 2
    pixelcut_screenshot_on_error: bool = True
    job_stale_minutes: int = 10
    max_image_upload_mb: int = 100


settings = Settings()
