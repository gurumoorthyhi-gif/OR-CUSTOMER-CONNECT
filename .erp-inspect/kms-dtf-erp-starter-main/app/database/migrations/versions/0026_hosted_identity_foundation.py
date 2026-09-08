"""Add hosted organization, identity, and session foundations."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0026_hosted_identity_foundation"
down_revision: str | None = "0025_gangsheet_copy_groups"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_id", sa.String(36), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_organizations_public_id", "organizations", ["public_id"], unique=True)
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    op.create_table(
        "organization_memberships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("is_owner", sa.Boolean(), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("disabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("organization_id", "user_id"),
    )
    op.create_index(
        "ix_organization_memberships_organization_id",
        "organization_memberships",
        ["organization_id"],
    )
    op.create_index(
        "ix_organization_memberships_user_id", "organization_memberships", ["user_id"]
    )
    op.create_index(
        "ix_organization_memberships_status", "organization_memberships", ["status"]
    )

    op.create_table(
        "membership_roles",
        sa.Column(
            "membership_id",
            sa.Integer(),
            sa.ForeignKey("organization_memberships.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "role_id",
            sa.Integer(),
            sa.ForeignKey("roles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "authentication_identities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("provider_subject", sa.String(255), nullable=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("provider", "provider_subject"),
    )
    op.create_index(
        "ix_authentication_identities_user_id",
        "authentication_identities",
        ["user_id"],
        unique=True,
    )

    op.create_table(
        "web_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=False),
    )
    for name, columns in (
        ("ix_web_sessions_user_id", ["user_id"]),
        ("ix_web_sessions_organization_id", ["organization_id"]),
        ("ix_web_sessions_expires_at", ["expires_at"]),
        ("ix_web_sessions_revoked_at", ["revoked_at"]),
    ):
        op.create_index(name, "web_sessions", columns)

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"]
    )
    op.create_index(
        "ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"]
    )

    with op.batch_alter_table("audit_records") as batch_op:
        batch_op.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column("request_id", sa.String(36), nullable=False, server_default="")
        )
        batch_op.add_column(
            sa.Column("ip_address", sa.String(45), nullable=False, server_default="")
        )
        batch_op.add_column(sa.Column("user_agent", sa.Text(), nullable=False, server_default=""))
        batch_op.create_foreign_key(
            "fk_audit_records_organization_id",
            "organizations",
            ["organization_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index("ix_audit_records_organization_id", ["organization_id"])
        batch_op.create_index("ix_audit_records_request_id", ["request_id"])


def downgrade() -> None:
    with op.batch_alter_table("audit_records") as batch_op:
        batch_op.drop_index("ix_audit_records_request_id")
        batch_op.drop_index("ix_audit_records_organization_id")
        batch_op.drop_constraint("fk_audit_records_organization_id", type_="foreignkey")
        batch_op.drop_column("user_agent")
        batch_op.drop_column("ip_address")
        batch_op.drop_column("request_id")
        batch_op.drop_column("organization_id")

    op.drop_index("ix_password_reset_tokens_expires_at", table_name="password_reset_tokens")
    op.drop_index("ix_password_reset_tokens_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    for name in (
        "ix_web_sessions_revoked_at",
        "ix_web_sessions_expires_at",
        "ix_web_sessions_organization_id",
        "ix_web_sessions_user_id",
    ):
        op.drop_index(name, table_name="web_sessions")
    op.drop_table("web_sessions")
    op.drop_index(
        "ix_authentication_identities_user_id", table_name="authentication_identities"
    )
    op.drop_table("authentication_identities")
    op.drop_table("membership_roles")
    op.drop_index(
        "ix_organization_memberships_status", table_name="organization_memberships"
    )
    op.drop_index(
        "ix_organization_memberships_user_id", table_name="organization_memberships"
    )
    op.drop_index(
        "ix_organization_memberships_organization_id",
        table_name="organization_memberships",
    )
    op.drop_table("organization_memberships")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_index("ix_organizations_public_id", table_name="organizations")
    op.drop_table("organizations")
