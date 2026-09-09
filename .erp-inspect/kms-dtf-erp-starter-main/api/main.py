"""Application factory for the KMS DTF ERP web API."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.authentication import ensure_developer_context
from api.config import WebSettings, get_web_settings
from api.database import configure_database
from api.middleware.request_context import RequestContextMiddleware
from api.routes.artwork import router as artwork_router
from api.routes.authentication import router as authentication_router
from api.routes.commercial import router as commercial_router
from api.routes.dashboard import router as dashboard_router
from api.routes.health import router as health_router

WEB_DIRECTORY = Path(__file__).resolve().parents[1] / "web"
BRAND_DIRECTORY = Path(__file__).resolve().parents[1] / "assets"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if app.state.settings.developer_mode and not app.state.settings.is_production:
        app.state.developer_context = ensure_developer_context(app.state.session_factory)
    yield
    app.state.database_engine.dispose()


def create_app(settings: WebSettings | None = None) -> FastAPI:
    settings = settings or get_web_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )
    app.state.settings = settings
    configure_database(app, settings.database_url)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Authorization",
            "Content-Type",
            "X-CSRF-Token",
            "X-Request-ID",
        ],
    )
    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(authentication_router, prefix=settings.api_prefix)
    app.include_router(artwork_router, prefix=settings.api_prefix)
    app.include_router(commercial_router, prefix=settings.api_prefix)
    app.include_router(dashboard_router, prefix=settings.api_prefix)
    app.mount("/brand", StaticFiles(directory=BRAND_DIRECTORY), name="brand-assets")
    app.mount("/assets", StaticFiles(directory=WEB_DIRECTORY), name="web-assets")
    app.mount("/", StaticFiles(directory=WEB_DIRECTORY, html=True), name="web-app")
    return app


app = create_app()
