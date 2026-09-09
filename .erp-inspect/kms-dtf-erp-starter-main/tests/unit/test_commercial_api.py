from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.config import WebSettings
from api.main import create_app
from app.database import Base, create_database_engine, create_session_factory, session_scope
from app.modules.authentication.models import Permission, Role, User
from app.modules.authentication.security import PasswordHasher
from app.modules.customers.models import Customer
from app.modules.hosted_identity.models import MembershipRole, Organization, OrganizationMembership

PASSWORD = "Commercial-Test-42"


@pytest.fixture
def commercial_client(tmp_path: Path):
    database_url = f"sqlite:///{tmp_path / 'commercial.db'}"
    engine = create_database_engine(database_url)
    Base.metadata.create_all(engine)
    factory = create_session_factory(engine)
    permission_codes = (
        "customers.view",
        "customers.manage",
        "products.view",
        "products.manage",
        "orders.view",
        "orders.manage",
    )
    with session_scope(factory) as session:
        permissions = [Permission(code=code, description=code) for code in permission_codes]
        role = Role(name="Manager", description="Manager", permissions=permissions)
        user = User(
            username="manager",
            password_hash=PasswordHasher().hash(PASSWORD),
            full_name="KMS Manager",
        )
        organization = Organization(
            public_id="00e69a64-ff67-4383-bcea-b84d15fbfb75",
            slug="kms",
            name="KMS DTF",
        )
        other = Organization(
            public_id="137272d7-9758-49ba-b2ba-1e5a28aed34f",
            slug="other",
            name="Other Company",
        )
        session.add_all([role, user, organization, other])
        session.flush()
        membership = OrganizationMembership(
            organization_id=organization.id,
            user_id=user.id,
            status="active",
            is_owner=True,
        )
        session.add(membership)
        session.flush()
        session.add(MembershipRole(membership_id=membership.id, role_id=role.id))
        session.add(
            Customer(
                organization_id=other.id,
                code="ZZ9999",
                name="Hidden Customer",
                phone="9999999999",
            )
        )

    app = create_app(
        WebSettings(
            app_env="test",
            database_url=database_url,
            storage_cache_directory=str(tmp_path / "cache"),
            local_object_directory=str(tmp_path / "objects"),
        )
    )
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "manager", "password": PASSWORD, "organization_slug": "kms"},
        )
        assert login.status_code == 200
        yield client
    engine.dispose()


def csrf(client: TestClient) -> dict[str, str]:
    token = client.cookies.get("kms_erp_csrf")
    assert token
    return {"X-CSRF-Token": token}


def test_commercial_workflow_and_tenant_isolation(commercial_client: TestClient) -> None:
    client = commercial_client
    assert client.get("/api/v1/customers").json() == []

    category = client.post(
        "/api/v1/categories", json={"name": "DTF Printing"}, headers=csrf(client)
    )
    assert category.status_code == 201
    product = client.post(
        "/api/v1/products",
        json={
            "code": "DTF-SQFT",
            "name": "DTF Print",
            "category_id": category.json()["id"],
            "unit": "sq ft",
            "base_price": "120.00",
            "tax_rate": "18.00",
        },
        headers=csrf(client),
    )
    assert product.status_code == 201

    customer = client.post(
        "/api/v1/customers",
        json={
            "name": "Ravi Garments",
            "phone": "9876543210",
            "business_name": "Ravi Garments",
            "delivery_type": "Courier",
            "preferred_courier": "ST",
            "billing_address": {"district": "Coimbatore"},
            "shipping_address": {"district": "Coimbatore"},
        },
        headers=csrf(client),
    )
    assert customer.status_code == 201
    assert customer.json()["summary"]["code"] == "CR0001"

    price = client.post(
        f"/api/v1/products/{product.json()['id']}/price",
        json={"quantity": "2"},
    )
    assert price.status_code == 200
    assert price.json()["total"] == "283.20"

    order = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer.json()["summary"]["id"],
            "items": [{"product_id": product.json()["id"], "quantity": "2"}],
            "order_type": "DTF",
            "priority": "High",
            "advance": "100.00",
        },
        headers=csrf(client),
    )
    assert order.status_code == 201
    assert order.json()["summary"]["balance"] == "183.20"

    changed = client.patch(
        f"/api/v1/orders/{order.json()['summary']['id']}/status",
        json={"status": "Designing", "note": "Artwork started"},
        headers=csrf(client),
    )
    assert changed.status_code == 200
    assert changed.json()["summary"]["status"] == "Designing"
    assert len(client.get("/api/v1/orders").json()) == 1


def test_commercial_writes_require_csrf(commercial_client: TestClient) -> None:
    response = commercial_client.post("/api/v1/categories", json={"name": "Blocked"})

    assert response.status_code == 403


def test_customer_folder_design_and_order_workflow(commercial_client: TestClient) -> None:
    client = commercial_client
    customer = client.post(
        "/api/v1/customers",
        json={
            "name": "Design Customer",
            "phone": "9876543210",
            "delivery_type": "Courier",
            "preferred_courier": "ST",
        },
        headers=csrf(client),
    ).json()
    customer_id = customer["summary"]["id"]

    folders = client.post(
        f"/api/v1/customers/{customer_id}/folders",
        json={"folder_date": "2026-08-14"},
        headers=csrf(client),
    )
    assert folders.status_code == 200
    assert folders.json()["dates"] == ["2026-08-14"]

    names = client.post(
        f"/api/v1/customers/{customer_id}/design-filenames",
        json={"source_names": ["front.cdr", "back.png"]},
        headers=csrf(client),
    )
    assert names.status_code == 200
    assert names.json()[0].startswith("CR0001 - DE1 - front.cdr")

    uploaded = client.post(
        f"/api/v1/customers/{customer_id}/files",
        data={"date_name": "2026-08-14", "folder_name": "Design"},
        files={"file": ("front.cdr", b"corel-design", "application/octet-stream")},
        headers=csrf(client),
    )
    assert uploaded.status_code == 201
    file_id = uploaded.json()["id"]

    order = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "order_type": "DTF",
            "design_file_ids": [file_id],
        },
        headers=csrf(client),
    )
    assert order.status_code == 201
    assert order.json()["design_file_ids"] == [file_id]
    assert client.get(f"/api/v1/customer-files/{file_id}").content == b"corel-design"
