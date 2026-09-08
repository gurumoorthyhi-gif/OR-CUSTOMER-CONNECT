"""add customer courier and billing profile fields

Revision ID: c4f1d2a8e9b0
Revises: 867624c49566
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c4f1d2a8e9b0"
down_revision: str | None = "867624c49566"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("delivery_type", sa.String(length=20), server_default="courier", nullable=False))
    op.add_column("customers", sa.Column("preferred_courier", sa.String(length=80), nullable=True))
    op.add_column("customers", sa.Column("billing_address", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("customers", "billing_address")
    op.drop_column("customers", "preferred_courier")
    op.drop_column("customers", "delivery_type")
