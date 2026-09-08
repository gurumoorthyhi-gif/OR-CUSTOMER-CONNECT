from pathlib import Path

import pytest
from sqlalchemy import text

from app.database import (
    Base,
    check_database_health,
    create_database_engine,
    create_session_factory,
    resolve_database_url,
    session_scope,
)
from app.modules.artwork import models as artwork_models
from app.modules.authentication import models as authentication_models
from app.modules.cloud_storage import models as cloud_storage_models
from app.modules.communications import models as communications_models
from app.modules.customers import models as customer_models
from app.modules.gang_sheets import models as gang_sheet_models
from app.modules.hosted_identity import models as hosted_identity_models
from app.modules.inventory import models as inventory_models
from app.modules.operations import models as operations_models
from app.modules.orders import models as order_models
from app.modules.production import models as production_models
from app.modules.products import models as product_models
from app.modules.sales import models as sales_models
from app.modules.shipping import models as shipping_models

_ = (
    artwork_models,
    authentication_models,
    cloud_storage_models,
    communications_models,
    customer_models,
    gang_sheet_models,
    hosted_identity_models,
    inventory_models,
    operations_models,
    order_models,
    production_models,
    product_models,
    sales_models,
    shipping_models,
)


def test_database_health_and_metadata(tmp_path: Path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'health.db'}")

    assert check_database_health(engine) is True
    assert set(Base.metadata.tables) == {
        "activity_logs",
        "authentication_identities",
        "authentication_throttles",
        "artwork_approvals",
        "artwork_versions",
        "artworks",
        "audit_records",
        "backup_history",
        "cloud_files",
        "communication_attachments",
        "communication_messages",
        "customer_addresses",
        "customer_file_references",
        "customer_notification_events",
        "customer_storage_dates",
        "customers",
        "credit_notes",
        "discount_rules",
        "dispatch_events",
        "dispatches",
        "gang_sheet_items",
        "gang_sheets",
        "inventory_items",
        "inventory_movements",
        "invoice_items",
        "invoices",
        "membership_roles",
        "message_templates",
        "order_items",
        "order_status_history",
        "orders",
        "organization_memberships",
        "organizations",
        "packings",
        "payments",
        "password_reset_tokens",
        "permissions",
        "price_rules",
        "product_categories",
        "production_events",
        "production_jobs",
        "products",
        "purchase_items",
        "purchases",
        "quality_checks",
        "role_permissions",
        "roles",
        "suppliers",
        "tax_configurations",
        "user_roles",
        "users",
        "web_sessions",
    }
    engine.dispose()


def test_session_scope_commits_and_rolls_back(tmp_path: Path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'sessions.db'}")
    factory = create_session_factory(engine)
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE probe (value INTEGER NOT NULL)"))

    with session_scope(factory) as session:
        session.execute(text("INSERT INTO probe (value) VALUES (1)"))

    with pytest.raises(RuntimeError):
        with session_scope(factory) as session:
            session.execute(text("INSERT INTO probe (value) VALUES (2)"))
            raise RuntimeError("force rollback")

    with engine.connect() as connection:
        count = connection.scalar(text("SELECT COUNT(*) FROM probe"))

    assert count == 1
    engine.dispose()


def test_database_health_reports_unavailable_sqlite_path(tmp_path: Path) -> None:
    missing_parent = tmp_path / "missing" / "database.db"
    engine = create_database_engine(f"sqlite:///{missing_parent}")

    assert check_database_health(engine) is False

    engine.dispose()


def test_relative_sqlite_url_resolves_against_application_path(tmp_path: Path) -> None:
    url = resolve_database_url(
        "sqlite:///data/application.db",
        base_directory=tmp_path,
    )

    assert Path(url.database or "") == (tmp_path / "data" / "application.db").resolve()


def test_sqlite_foreign_keys_are_enabled(tmp_path: Path) -> None:
    engine = create_database_engine(f"sqlite:///{tmp_path / 'foreign-keys.db'}")

    with engine.connect() as connection:
        enabled = connection.scalar(text("PRAGMA foreign_keys"))

    assert enabled == 1
    engine.dispose()
