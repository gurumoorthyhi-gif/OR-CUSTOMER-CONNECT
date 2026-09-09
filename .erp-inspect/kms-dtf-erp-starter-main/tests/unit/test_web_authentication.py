from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.config import WebSettings
from api.main import create_app
from app.database import Base, create_database_engine, create_session_factory, session_scope
from app.modules.authentication.models import Permission, Role, User
from app.modules.authentication.security import PasswordHasher
from app.modules.hosted_identity.models import (
    MembershipRole,
    Organization,
    OrganizationMembership,
)

PASSWORD = "Correct-Horse-42"
NEW_PASSWORD = "Even-Better-Horse-84"


@pytest.fixture
def web_auth_client(tmp_path: Path):
    database_url = f"sqlite:///{tmp_path / 'web-auth.db'}"
    engine = create_database_engine(database_url)
    Base.metadata.create_all(engine)
    factory = create_session_factory(engine)

    with session_scope(factory) as session:
        permission = Permission(code="users.manage", description="Manage users")
        admin_role = Role(
            name="Administrator",
            description="Administrator",
            permissions=[permission],
        )
        viewer_role = Role(name="Viewer", description="Viewer", permissions=[])
        owner = User(
            username="owner",
            password_hash=PasswordHasher().hash(PASSWORD),
            full_name="Business Owner",
            email="owner@example.test",
        )
        employee = User(
            username="employee",
            password_hash=PasswordHasher().hash(PASSWORD),
            full_name="Employee",
            email="employee@example.test",
        )
        outsider = User(
            username="outsider",
            password_hash=PasswordHasher().hash(PASSWORD),
            full_name="Other Company User",
            email="outsider@example.test",
        )
        organization = Organization(
            public_id="fded4382-f280-4054-9afb-fb998466f8e4",
            slug="kms",
            name="KMS DTF",
        )
        other_organization = Organization(
            public_id="de4f5b03-085e-4b62-90a3-1d695bb43788",
            slug="other-company",
            name="Other Company",
        )
        session.add_all(
            [admin_role, viewer_role, owner, employee, outsider, organization, other_organization]
        )
        session.flush()
        owner_membership = OrganizationMembership(
            organization_id=organization.id,
            user_id=owner.id,
            status="active",
            is_owner=True,
        )
        employee_membership = OrganizationMembership(
            organization_id=organization.id,
            user_id=employee.id,
            status="active",
        )
        outsider_membership = OrganizationMembership(
            organization_id=other_organization.id,
            user_id=outsider.id,
            status="active",
        )
        session.add_all([owner_membership, employee_membership, outsider_membership])
        session.flush()
        session.add_all(
            [
                MembershipRole(membership_id=owner_membership.id, role_id=admin_role.id),
                MembershipRole(membership_id=employee_membership.id, role_id=viewer_role.id),
            ]
        )
        employee_id = employee.id
        outsider_id = outsider.id

    settings = WebSettings(app_env="test", database_url=database_url)
    app = create_app(settings)
    reset_deliveries: list[tuple[int, str]] = []
    app.state.password_reset_dispatcher = lambda user_id, token: reset_deliveries.append(
        (user_id, token)
    )
    with TestClient(app) as client:
        yield client, reset_deliveries, employee_id, outsider_id
    app.state.database_engine.dispose()
    engine.dispose()


def login(client: TestClient, username: str = "owner", password: str = PASSWORD):
    return client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password, "organization_slug": "kms"},
    )


def csrf_header(client: TestClient) -> dict[str, str]:
    token = client.cookies.get("kms_erp_csrf")
    assert token
    return {"X-CSRF-Token": token}


def test_login_uses_secure_session_cookie_and_resolves_permissions(web_auth_client) -> None:
    client, _, _, _ = web_auth_client

    response = login(client)

    assert response.status_code == 200
    assert response.json()["organization_name"] == "KMS DTF"
    assert response.json()["roles"] == ["Administrator"]
    assert response.json()["permissions"] == ["users.manage"]
    session_cookie = response.headers.get_list("set-cookie")[0]
    assert "HttpOnly" in session_cookie
    assert "SameSite=lax" in session_cookie
    assert "Cache-Control" in response.headers
    assert client.get("/api/v1/auth/me").status_code == 200


def test_invalid_login_is_generic_and_does_not_create_session(web_auth_client) -> None:
    client, _, _, _ = web_auth_client

    missing = login(client, username="missing", password="wrong-password")
    wrong = login(client, username="owner", password="wrong-password")

    assert missing.status_code == 401
    assert wrong.status_code == 401
    assert missing.json() == wrong.json()
    assert "kms_erp_session" not in client.cookies


def test_repeated_login_failures_are_persistently_throttled(web_auth_client) -> None:
    client, _, _, _ = web_auth_client

    for _ in range(5):
        assert login(client, password="wrong-password").status_code == 401

    blocked = login(client, password=PASSWORD)

    assert blocked.status_code == 429
    assert blocked.json()["detail"] == "Too many login attempts; try again later"


def test_logout_requires_csrf_and_revokes_session(web_auth_client) -> None:
    client, _, _, _ = web_auth_client
    assert login(client).status_code == 200

    rejected = client.post("/api/v1/auth/logout")
    accepted = client.post("/api/v1/auth/logout", headers=csrf_header(client))

    assert rejected.status_code == 403
    assert accepted.status_code == 200
    assert client.get("/api/v1/auth/me").status_code == 401


def test_password_reset_is_non_enumerating_single_use_and_revokes_sessions(
    web_auth_client,
) -> None:
    client, reset_deliveries, _, _ = web_auth_client
    assert login(client).status_code == 200

    existing = client.post(
        "/api/v1/auth/password-reset/request", json={"identifier": "owner@example.test"}
    )
    missing = client.post(
        "/api/v1/auth/password-reset/request", json={"identifier": "nobody@example.test"}
    )
    assert existing.status_code == 202
    assert missing.status_code == 202
    assert existing.json() == missing.json()
    assert len(reset_deliveries) == 1
    raw_token = reset_deliveries[0][1]

    confirmed = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": raw_token, "new_password": NEW_PASSWORD},
    )
    reused = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": raw_token, "new_password": NEW_PASSWORD},
    )

    assert confirmed.status_code == 200
    assert reused.status_code == 400
    assert client.get("/api/v1/auth/me").status_code == 401
    assert login(client, password=PASSWORD).status_code == 401
    assert login(client, password=NEW_PASSWORD).status_code == 200


def test_permission_and_account_controls(web_auth_client) -> None:
    client, _, employee_id, _ = web_auth_client
    assert login(client, username="employee").status_code == 200
    denied = client.patch(
        f"/api/v1/auth/users/{employee_id}/status",
        json={"is_active": False},
        headers=csrf_header(client),
    )
    assert denied.status_code == 403

    client.cookies.clear()
    assert login(client).status_code == 200
    disabled = client.patch(
        f"/api/v1/auth/users/{employee_id}/status",
        json={"is_active": False},
        headers=csrf_header(client),
    )
    assert disabled.status_code == 200
    client.cookies.clear()
    assert login(client, username="employee").status_code == 401


def test_administrator_cannot_disable_own_account(web_auth_client) -> None:
    client, _, _, _ = web_auth_client
    response = login(client)
    owner_id = response.json()["id"]

    rejected = client.patch(
        f"/api/v1/auth/users/{owner_id}/status",
        json={"is_active": False},
        headers=csrf_header(client),
    )

    assert rejected.status_code == 400
    assert client.get("/api/v1/auth/me").status_code == 200


def test_administrator_cannot_manage_another_organization(web_auth_client) -> None:
    client, _, _, outsider_id = web_auth_client
    assert login(client).status_code == 200

    rejected = client.patch(
        f"/api/v1/auth/users/{outsider_id}/status",
        json={"is_active": False},
        headers=csrf_header(client),
    )

    assert rejected.status_code == 404
