"""lock customer profile after first customer-side save

Revision ID: d9a6c2f7b1e4
Revises: c4f1d2a8e9b0
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "d9a6c2f7b1e4"
down_revision: str | None = "c4f1d2a8e9b0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("profile_locked", sa.Boolean(), server_default=sa.text("0"), nullable=False))


def downgrade() -> None:
    op.drop_column("customers", "profile_locked")
