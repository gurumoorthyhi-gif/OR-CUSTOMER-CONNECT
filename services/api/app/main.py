import asyncio
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.api.app.core.config import settings
from services.api.app.db.init_db import init_db
from services.api.app.modules.customers.routes import PROFILE_UPLOAD_DIR
from services.api.app.modules.messages.routes import UPLOAD_DIR
from services.api.app.modules.image_processing.routes import PROCESSING_DIR
from services.api.app.modules.image_processing.workers import worker_manager
from services.api.app.routers import api_router


if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    await worker_manager.start()
    try:
        yield
    finally:
        await worker_manager.stop()


app = FastAPI(
    title="ODD RAVEN API",
    version="0.1.0",
    description="Customer app and operations API for ODD RAVEN DTF printing.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def api_home() -> dict[str, str]:
    return {
        "name": "ODD RAVEN API",
        "status": "running",
        "health": "/health",
        "docs": "/docs",
        "api": "/api",
    }


app.include_router(api_router, prefix="/api")
app.mount("/api/messages/uploads", StaticFiles(directory=UPLOAD_DIR), name="message-uploads")
app.mount("/api/customers/profile-uploads", StaticFiles(directory=PROFILE_UPLOAD_DIR), name="profile-uploads")
app.mount("/api/image-processing/files", StaticFiles(directory=PROCESSING_DIR), name="image-processing-files")
