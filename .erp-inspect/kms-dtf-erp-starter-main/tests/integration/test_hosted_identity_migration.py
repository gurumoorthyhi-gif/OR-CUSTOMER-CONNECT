from pathlib import Path

from sqlalchemy import inspect, text

from app.database import create_database_engine, upgrade_database


def test_hosted_identity_migration_adds_tenant_and_session_foundations(
    tmp_path: Path,
) -> None:
    url = "sqlite:///hosted-identity.db"
    upgrade_database(url, base_directory=tmp_path)
    engine = create_database_engine(url, base_directory=tmp_path)
    inspector = inspect(engine)

    expected_tables = {
        "authentication_identities",
        "authentication_throttles",
        "membership_roles",
        "organization_memberships",
        "organizations",
        "password_reset_tokens",
        "web_sessions",
    }
    assert expected_tables <= set(inspector.get_table_names())

    audit_columns = {column["name"] for column in inspector.get_columns("audit_records")}
    assert {"organization_id", "request_id", "ip_address", "user_agent"} <= audit_columns
    for table_name in (
        "customers",
        "product_categories",
        "products",
        "discount_rules",
        "tax_configurations",
        "orders",
    ):
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        assert "organization_id" in columns

    membership_uniques = inspector.get_unique_constraints("organization_memberships")
    assert any(
        set(constraint["column_names"]) == {"organization_id", "user_id"}
        for constraint in membership_uniques
    )
    identity_uniques = inspector.get_unique_constraints("authentication_identities")
    assert any(
        set(constraint["column_names"]) == {"provider", "provider_subject"}
        for constraint in identity_uniques
    )

    engine.dispose()


def test_hosted_identity_upgrade_preserves_existing_desktop_identity_data(
    tmp_path: Path,
) -> None:
    url = "sqlite:///desktop-upgrade.db"
    upgrade_database(url, base_directory=tmp_path, revision="0025_gangsheet_copy_groups")
    engine = create_database_engine(url, base_directory=tmp_path)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                INSERT INTO users (
                    id, username, password_hash, full_name, email, is_active,
                    created_at, updated_at, last_login_at
                ) VALUES (
                    41, 'existing-admin', 'preserved-hash', 'Existing Admin',
                    'admin@example.test', 1, :created_at, :updated_at, NULL
                )
                """
            ),
            {"created_at": "2026-08-14 00:00:00", "updated_at": "2026-08-14 00:00:00"},
        )
        connection.execute(
            text(
                "INSERT INTO roles (id, name, description) "
                "VALUES (7, 'Administrator', 'Existing role')"
            )
        )
        connection.execute(text("INSERT INTO user_roles (user_id, role_id) VALUES (41, 7)"))
    engine.dispose()

    upgrade_database(url, base_directory=tmp_path)
    upgraded_engine = create_database_engine(url, base_directory=tmp_path)
    with upgraded_engine.connect() as connection:
        user = connection.execute(
            text("SELECT username, password_hash FROM users WHERE id = 41")
        ).one()
        role_link = connection.scalar(
            text("SELECT COUNT(*) FROM user_roles WHERE user_id = 41 AND role_id = 7")
        )

    assert user.username == "existing-admin"
    assert user.password_hash == "preserved-hash"
    assert role_link == 1
    upgraded_engine.dispose()
