"""Add persistent web login throttling."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0027_authentication_throttles"
down_revision: str | None = "0026_hosted_identity_foundation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "authentication_throttles",
        sa.Column("key_hash", sa.String(64), primary_key=True),
        sa.Column("failure_count", sa.Integer(), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_authentication_throttles_locked_until",
        "authentication_throttles",
        ["locked_until"],
    )
    op.create_index(
        "ix_authentication_throttles_last_attempt_at",
        "authentication_throttles",
        ["last_attempt_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_authentication_throttles_last_attempt_at",
        table_name="authentication_throttles",
    )
    op.drop_index(
        "ix_authentication_throttles_locked_until",
        table_name="authentication_throttles",
    )
    op.drop_table("authentication_throttles")
