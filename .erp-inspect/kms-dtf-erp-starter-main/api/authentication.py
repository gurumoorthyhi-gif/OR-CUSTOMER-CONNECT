"""Hosted login, session, reset, and permission enforcement."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import or_, select, text, update
from sqlalchemy.orm import selectinload

from api.config import WebSettings
from api.database import get_session_factory
from app.database import SessionFactory, session_scope
from app.modules.authentication.models import ActivityLog, Permission, Role, User
from app.modules.authentication.permissions import PERMISSIONS
from app.modules.authentication.security import PasswordHasher
from app.modules.hosted_identity.models import (
    AuthenticationThrottle,
    MembershipRole,
    Organization,
    OrganizationMembership,
    PasswordResetToken,
    WebSession,
)

INVALID_CREDENTIALS = "Invalid username or password"


class AuthenticationThrottledError(ValueError):
    """Raised when a persistent failed-login window is locked."""


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def ensure_developer_context(session_factory: SessionFactory) -> WebAuthContext:
    """Create the local-only identity boundary required by Developer Mode."""

    with session_scope(session_factory) as session:
        organization = session.scalar(select(Organization).where(Organization.slug == "kms"))
        if organization is None:
            organization = Organization(
                public_id=str(uuid4()),
                slug="kms",
                name="KMS Development",
                is_active=True,
            )
            session.add(organization)
            session.flush()
        user = session.scalar(select(User).where(User.username == "developer"))
        if user is None:
            user = User(
                username="developer",
                password_hash="developer-mode-disabled-password",
                full_name="Developer Mode",
                is_active=True,
            )
            session.add(user)
            session.flush()
        membership = session.scalar(
            select(OrganizationMembership).where(
                OrganizationMembership.organization_id == organization.id,
                OrganizationMembership.user_id == user.id,
            )
        )
        if membership is None:
            session.add(
                OrganizationMembership(
                    organization_id=organization.id,
                    user_id=user.id,
                    status="active",
                    is_owner=True,
                )
            )
        for table_name in (
            "customers",
            "product_categories",
            "products",
            "discount_rules",
            "tax_configurations",
            "orders",
            "artworks",
            "cloud_files",
        ):
            session.execute(
                text(
                    f"UPDATE {table_name} SET organization_id = :organization_id "  # noqa: S608
                    "WHERE organization_id IS NULL"
                ),
                {"organization_id": organization.id},
            )
        context = WebAuthContext(
            session_id="developer-mode",
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            organization_id=organization.id,
            organization_name=organization.name,
            roles=frozenset({"Administrator"}),
            permissions=frozenset(PERMISSIONS),
        )
    return context


@dataclass(frozen=True)
class WebAuthContext:
    session_id: str
    user_id: int
    username: str
    full_name: str
    organization_id: int
    organization_name: str
    roles: frozenset[str]
    permissions: frozenset[str]


@dataclass(frozen=True)
class IssuedSession:
    token: str
    csrf_token: str
    context: WebAuthContext


class WebAuthenticationService:
    def __init__(
        self,
        session_factory: SessionFactory,
        settings: WebSettings,
        password_hasher: PasswordHasher | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._settings = settings
        self._password_hasher = password_hasher or PasswordHasher()

    def login(
        self,
        *,
        username: str,
        password: str,
        organization_slug: str | None,
        ip_address: str,
        user_agent: str,
    ) -> IssuedSession:
        normalized = username.strip().casefold()
        throttle_key = hash_token(f"{normalized}|{ip_address}")
        self._ensure_login_allowed(throttle_key)

        with session_scope(self._session_factory) as session:
            user = session.scalar(select(User).where(User.username == normalized))
            if user is None or not user.is_active or not self._password_hasher.verify(
                password, user.password_hash
            ):
                rejected_user_id = user.id if user is not None else None
            else:
                rejected_user_id = None

        if user is None or not user.is_active or rejected_user_id is not None:
            self._record_login_failure(throttle_key, rejected_user_id, normalized)
            raise ValueError(INVALID_CREDENTIALS)

        membership_failure = False
        with session_scope(self._session_factory) as session:
            user = session.get(User, user.id)
            if user is None:
                self._record_login_failure(throttle_key, None, normalized)
                raise ValueError(INVALID_CREDENTIALS)
            membership_statement = (
                select(OrganizationMembership)
                .join(Organization)
                .where(
                    OrganizationMembership.user_id == user.id,
                    OrganizationMembership.status == "active",
                    Organization.is_active.is_(True),
                )
                .options(selectinload(OrganizationMembership.organization))
            )
            if organization_slug:
                membership_statement = membership_statement.where(
                    Organization.slug == organization_slug.strip().casefold()
                )
            memberships = list(session.scalars(membership_statement))
            if len(memberships) != 1:
                membership_failure = True

            if membership_failure:
                membership = None
            else:
                membership = memberships[0]

            if membership is None:
                role_rows = []
            else:
                role_rows = session.execute(
                    select(Role.name, Permission.code)
                    .join(MembershipRole, MembershipRole.role_id == Role.id)
                    .join(Role.permissions)
                    .where(MembershipRole.membership_id == membership.id)
                ).all()
            roles = frozenset(row.name for row in role_rows)
            permissions = frozenset(row.code for row in role_rows)

            if membership is None:
                context = None
            else:
                raw_token = secrets.token_urlsafe(48)
                csrf_token = secrets.token_urlsafe(32)
                now = utc_now()
                web_session = WebSession(
                    id=str(uuid4()),
                    user_id=user.id,
                    organization_id=membership.organization_id,
                    token_hash=hash_token(raw_token),
                    created_at=now,
                    last_seen_at=now,
                    expires_at=now + timedelta(hours=self._settings.session_lifetime_hours),
                    ip_address=ip_address[:45],
                    user_agent=user_agent[:2000],
                )
                session.add(web_session)
                user.last_login_at = now
                session.add(
                    ActivityLog(
                        user_id=user.id,
                        action="web.login.succeeded",
                        details=f"Web login for organization {membership.organization_id}",
                    )
                )
                context = WebAuthContext(
                    session_id=web_session.id,
                    user_id=user.id,
                    username=user.username,
                    full_name=user.full_name,
                    organization_id=membership.organization_id,
                    organization_name=membership.organization.name,
                    roles=roles,
                    permissions=permissions,
                )

        if context is None:
            self._record_login_failure(throttle_key, user.id, normalized)
            raise ValueError(INVALID_CREDENTIALS)
        self._clear_login_failures(throttle_key)
        return IssuedSession(token=raw_token, csrf_token=csrf_token, context=context)

    def _ensure_login_allowed(self, throttle_key: str) -> None:
        now = utc_now()
        with session_scope(self._session_factory) as session:
            throttle = session.get(AuthenticationThrottle, throttle_key)
            if throttle is not None and throttle.locked_until is not None:
                locked_until = throttle.locked_until
                if locked_until.tzinfo is None:
                    locked_until = locked_until.replace(tzinfo=UTC)
                if locked_until > now:
                    raise AuthenticationThrottledError(
                        "Too many login attempts; try again later"
                    )

    def _record_login_failure(
        self,
        throttle_key: str,
        user_id: int | None,
        normalized_username: str,
    ) -> None:
        now = utc_now()
        window = timedelta(minutes=self._settings.login_window_minutes)
        with session_scope(self._session_factory) as session:
            throttle = session.get(AuthenticationThrottle, throttle_key)
            if throttle is None:
                throttle = AuthenticationThrottle(
                    key_hash=throttle_key,
                    failure_count=0,
                    window_started_at=now,
                    last_attempt_at=now,
                )
                session.add(throttle)
            window_started = throttle.window_started_at
            if window_started.tzinfo is None:
                window_started = window_started.replace(tzinfo=UTC)
            if now - window_started >= window:
                throttle.failure_count = 0
                throttle.window_started_at = now
                throttle.locked_until = None
            throttle.failure_count += 1
            throttle.last_attempt_at = now
            if throttle.failure_count >= self._settings.login_max_attempts:
                throttle.locked_until = now + window
            session.add(
                ActivityLog(
                    user_id=user_id,
                    action="web.login.failed",
                    details=f"Rejected web login for {normalized_username}",
                )
            )

    def _clear_login_failures(self, throttle_key: str) -> None:
        with session_scope(self._session_factory) as session:
            throttle = session.get(AuthenticationThrottle, throttle_key)
            if throttle is not None:
                session.delete(throttle)

    def resolve_session(self, raw_token: str) -> WebAuthContext | None:
        now = utc_now()
        with session_scope(self._session_factory) as session:
            statement = (
                select(WebSession)
                .join(User)
                .join(Organization)
                .join(
                    OrganizationMembership,
                    (OrganizationMembership.user_id == WebSession.user_id)
                    & (
                        OrganizationMembership.organization_id
                        == WebSession.organization_id
                    ),
                )
                .where(
                    WebSession.token_hash == hash_token(raw_token),
                    WebSession.revoked_at.is_(None),
                    WebSession.expires_at > now,
                    User.is_active.is_(True),
                    Organization.is_active.is_(True),
                    OrganizationMembership.status == "active",
                )
                .options(
                    selectinload(WebSession.user),
                    selectinload(WebSession.organization),
                )
            )
            web_session = session.scalar(statement)
            if web_session is None:
                return None
            membership_id = session.scalar(
                select(OrganizationMembership.id).where(
                    OrganizationMembership.user_id == web_session.user_id,
                    OrganizationMembership.organization_id == web_session.organization_id,
                    OrganizationMembership.status == "active",
                )
            )
            if membership_id is None:
                return None
            role_rows = session.execute(
                select(Role.name, Permission.code)
                .join(MembershipRole, MembershipRole.role_id == Role.id)
                .join(Role.permissions)
                .where(MembershipRole.membership_id == membership_id)
            ).all()
            web_session.last_seen_at = now
            return WebAuthContext(
                session_id=web_session.id,
                user_id=web_session.user_id,
                username=web_session.user.username,
                full_name=web_session.user.full_name,
                organization_id=web_session.organization_id,
                organization_name=web_session.organization.name,
                roles=frozenset(row.name for row in role_rows),
                permissions=frozenset(row.code for row in role_rows),
            )

    def logout(self, session_id: str) -> None:
        now = utc_now()
        with session_scope(self._session_factory) as session:
            web_session = session.get(WebSession, session_id)
            if web_session is not None and web_session.revoked_at is None:
                web_session.revoked_at = now
                session.add(
                    ActivityLog(
                        user_id=web_session.user_id,
                        action="web.logout",
                        details="Web session revoked",
                    )
                )

    def request_password_reset(self, identifier: str) -> tuple[int, str] | None:
        normalized = identifier.strip().casefold()
        with session_scope(self._session_factory) as session:
            user = session.scalar(
                select(User).where(
                    User.is_active.is_(True),
                    or_(User.username == normalized, User.email == normalized),
                )
            )
            if user is None:
                return None
            raw_token = secrets.token_urlsafe(48)
            now = utc_now()
            session.add(
                PasswordResetToken(
                    id=str(uuid4()),
                    user_id=user.id,
                    token_hash=hash_token(raw_token),
                    created_at=now,
                    expires_at=now + timedelta(minutes=30),
                )
            )
            session.add(
                ActivityLog(
                    user_id=user.id,
                    action="web.password_reset.requested",
                    details="Password reset requested",
                )
            )
            return user.id, raw_token

    def confirm_password_reset(self, raw_token: str, new_password: str) -> None:
        now = utc_now()
        new_hash = self._password_hasher.hash(new_password)
        with session_scope(self._session_factory) as session:
            reset = session.scalar(
                select(PasswordResetToken).where(
                    PasswordResetToken.token_hash == hash_token(raw_token),
                    PasswordResetToken.used_at.is_(None),
                    PasswordResetToken.expires_at > now,
                )
            )
            if reset is None:
                raise ValueError("Invalid or expired password reset token")
            user = session.get(User, reset.user_id)
            if user is None or not user.is_active:
                raise ValueError("Invalid or expired password reset token")
            user.password_hash = new_hash
            user.updated_at = now
            reset.used_at = now
            session.execute(
                update(WebSession)
                .where(WebSession.user_id == user.id, WebSession.revoked_at.is_(None))
                .values(revoked_at=now)
            )
            session.add(
                ActivityLog(
                    user_id=user.id,
                    action="web.password_reset.completed",
                    details="Password reset completed; sessions revoked",
                )
            )

    def set_user_active(
        self,
        user_id: int,
        is_active: bool,
        actor_user_id: int,
        organization_id: int,
    ) -> None:
        now = utc_now()
        with session_scope(self._session_factory) as session:
            user = session.scalar(
                select(User)
                .join(OrganizationMembership)
                .where(
                    User.id == user_id,
                    OrganizationMembership.organization_id == organization_id,
                )
            )
            if user is None:
                raise LookupError("User not found")
            if user.id == actor_user_id and not is_active:
                raise ValueError("You cannot disable your own account")
            user.is_active = is_active
            user.updated_at = now
            if not is_active:
                session.execute(
                    update(WebSession)
                    .where(WebSession.user_id == user.id, WebSession.revoked_at.is_(None))
                    .values(revoked_at=now)
                )
            session.add(
                ActivityLog(
                    user_id=actor_user_id,
                    action="web.user.enabled" if is_active else "web.user.disabled",
                    details=f"Account status changed for user {user.id}",
                )
            )


def get_auth_service(
    request: Request,
    session_factory: SessionFactory = Depends(get_session_factory),
) -> WebAuthenticationService:
    return WebAuthenticationService(session_factory, request.app.state.settings)


def get_current_auth(
    request: Request,
    service: WebAuthenticationService = Depends(get_auth_service),
) -> WebAuthContext:
    settings: WebSettings = request.app.state.settings
    if settings.developer_mode and not settings.is_production:
        return request.app.state.developer_context
    token = request.cookies.get(settings.session_cookie_name)
    context = service.resolve_session(token) if token else None
    if context is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return context


def require_csrf(request: Request) -> None:
    settings: WebSettings = request.app.state.settings
    if settings.developer_mode and not settings.is_production:
        return
    cookie_token = request.cookies.get(settings.csrf_cookie_name, "")
    header_token = request.headers.get("X-CSRF-Token", "")
    if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")


def require_permission(permission_code: str):
    def dependency(context: WebAuthContext = Depends(get_current_auth)) -> WebAuthContext:
        if permission_code not in context.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission_code}",
            )
        return context

    return dependency
