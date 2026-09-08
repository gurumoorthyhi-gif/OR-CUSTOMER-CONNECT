"""Browser authentication endpoints."""

from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from api.authentication import (
    AuthenticationThrottledError,
    WebAuthContext,
    WebAuthenticationService,
    get_auth_service,
    get_current_auth,
    require_csrf,
    require_permission,
)
from api.config import WebSettings
from api.schemas.authentication import (
    AccountStatusRequest,
    AuthenticatedUserResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


def to_response(context: WebAuthContext) -> AuthenticatedUserResponse:
    return AuthenticatedUserResponse(
        id=context.user_id,
        username=context.username,
        full_name=context.full_name,
        organization_id=context.organization_id,
        organization_name=context.organization_name,
        roles=sorted(context.roles),
        permissions=sorted(context.permissions),
    )


@router.post("/login", response_model=AuthenticatedUserResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: WebAuthenticationService = Depends(get_auth_service),
) -> AuthenticatedUserResponse:
    settings: WebSettings = request.app.state.settings
    try:
        issued = service.login(
            username=payload.username,
            password=payload.password.get_secret_value(),
            organization_slug=payload.organization_slug,
            ip_address=request.client.host if request.client else "",
            user_agent=request.headers.get("User-Agent", ""),
        )
    except AuthenticationThrottledError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    cookie_options = {
        "secure": settings.is_production,
        "samesite": "lax",
        "path": "/",
        "max_age": settings.session_lifetime_hours * 3600,
    }
    response.set_cookie(
        settings.session_cookie_name,
        issued.token,
        httponly=True,
        **cookie_options,
    )
    response.set_cookie(
        settings.csrf_cookie_name,
        issued.csrf_token,
        httponly=False,
        **cookie_options,
    )
    response.headers["Cache-Control"] = "no-store"
    return to_response(issued.context)


@router.get("/me", response_model=AuthenticatedUserResponse)
def me(context: WebAuthContext = Depends(get_current_auth)) -> AuthenticatedUserResponse:
    return to_response(context)


@router.post("/logout", response_model=MessageResponse, dependencies=[Depends(require_csrf)])
def logout(
    request: Request,
    response: Response,
    context: WebAuthContext = Depends(get_current_auth),
    service: WebAuthenticationService = Depends(get_auth_service),
) -> MessageResponse:
    settings: WebSettings = request.app.state.settings
    if context.session_id != "developer-mode":
        service.logout(context.session_id)
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.delete_cookie(settings.csrf_cookie_name, path="/")
    response.headers["Cache-Control"] = "no-store"
    return MessageResponse(message="Logged out")


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def request_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    service: WebAuthenticationService = Depends(get_auth_service),
) -> MessageResponse:
    issued = service.request_password_reset(payload.identifier)
    dispatcher: Callable[[int, str], None] | None = getattr(
        request.app.state, "password_reset_dispatcher", None
    )
    if issued is not None and dispatcher is not None:
        dispatcher(*issued)
    return MessageResponse(message="If the account exists, reset instructions will be sent")


@router.post("/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(
    payload: PasswordResetConfirmRequest,
    service: WebAuthenticationService = Depends(get_auth_service),
) -> MessageResponse:
    try:
        service.confirm_password_reset(
            payload.token.get_secret_value(), payload.new_password.get_secret_value()
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password updated; sign in again")


@router.patch(
    "/users/{user_id}/status",
    response_model=MessageResponse,
    dependencies=[Depends(require_csrf)],
)
def set_account_status(
    user_id: int,
    payload: AccountStatusRequest,
    context: WebAuthContext = Depends(require_permission("users.manage")),
    service: WebAuthenticationService = Depends(get_auth_service),
) -> MessageResponse:
    try:
        service.set_user_active(
            user_id,
            payload.is_active,
            context.user_id,
            context.organization_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Account status updated")
