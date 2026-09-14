"""Private artwork upload, version, preview, download, and approval routes."""

from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, RedirectResponse

from api.artwork import WebArtworkService, save_upload_to_temporary
from api.authentication import WebAuthContext, require_csrf, require_permission
from api.schemas.artwork import (
    ApprovalPayload,
    ArtworkDetailsResponse,
    ArtworkSummaryResponse,
)

router = APIRouter(prefix="/artwork", tags=["artwork"])


def service(request: Request, context: WebAuthContext) -> WebArtworkService:
    return WebArtworkService(
        request.app.state.session_factory,
        request.app.state.settings,
        context.organization_id,
        context.user_id,
    )


@router.get("", response_model=list[ArtworkSummaryResponse])
def list_artwork(
    request: Request,
    query: str = Query(default="", max_length=160),
    context: WebAuthContext = Depends(require_permission("artwork.view")),
):
    manager = service(request, context)
    try:
        return manager.list(query)
    finally:
        manager.close()


@router.post(
    "",
    response_model=ArtworkDetailsResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_csrf)],
)
def upload_artwork(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(""),
    tags: str = Form(""),
    customer_id: int | None = Form(None),
    order_id: int | None = Form(None),
    notes: str = Form(""),
    context: WebAuthContext = Depends(require_permission("artwork.manage")),
):
    temporary: Path | None = None
    manager = service(request, context)
    try:
        temporary = save_upload_to_temporary(
            file, request.app.state.settings.maximum_upload_mb * 1024 * 1024
        )
        return manager.upload(
            temporary,
            original_filename=Path(file.filename or "upload").name,
            title=title,
            tags=tuple(tags.split(",")),
            customer_id=customer_id,
            order_id=order_id,
            notes=notes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        manager.close()


@router.post(
    "/{artwork_id}/versions",
    response_model=ArtworkDetailsResponse,
    dependencies=[Depends(require_csrf)],
)
def add_version(
    artwork_id: int,
    request: Request,
    file: UploadFile = File(...),
    notes: str = Form(""),
    context: WebAuthContext = Depends(require_permission("artwork.manage")),
):
    temporary: Path | None = None
    manager = service(request, context)
    try:
        temporary = save_upload_to_temporary(
            file, request.app.state.settings.maximum_upload_mb * 1024 * 1024
        )
        return manager.add_version(
            artwork_id, temporary, Path(file.filename or "upload").name, notes
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
        manager.close()


@router.post(
    "/versions/{version_id}/approval",
    response_model=ArtworkDetailsResponse,
    dependencies=[Depends(require_csrf)],
)
def record_approval(
    version_id: int,
    payload: ApprovalPayload,
    request: Request,
    context: WebAuthContext = Depends(require_permission("artwork.approve")),
):
    manager = service(request, context)
    try:
        return manager.approve(version_id, payload.status, payload.note)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        manager.close()


@router.get("/versions/{version_id}/{kind}")
def access_version_file(
    version_id: int,
    kind: str,
    request: Request,
    context: WebAuthContext = Depends(require_permission("artwork.view")),
):
    if kind not in {"original", "preview"}:
        raise HTTPException(status_code=404, detail="File type not found")
    manager = service(request, context)
    try:
        record = manager.file_record(version_id, preview=kind == "preview")
        cached = Path(record.local_path)
        if cached.is_file():
            return FileResponse(
                cached,
                media_type=record.content_type or None,
                filename=record.original_name if kind == "original" else None,
            )
        return RedirectResponse(manager.cloud.access_url(record.id), status_code=307)
    except (LookupError, RuntimeError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        manager.close()


@router.get("/{artwork_id}", response_model=ArtworkDetailsResponse)
def get_artwork(
    artwork_id: int,
    request: Request,
    context: WebAuthContext = Depends(require_permission("artwork.view")),
):
    manager = service(request, context)
    try:
        return manager.get(artwork_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    finally:
        manager.close()
