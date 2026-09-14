"""Add organization boundaries to core commercial records."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0028_commercial_organization_scope"
down_revision: str | None = "0027_authentication_throttles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SCOPED_TABLES = (
    "customers",
    "product_categories",
    "products",
    "discount_rules",
    "tax_configurations",
    "orders",
)


def upgrade() -> None:
    for table_name in SCOPED_TABLES:
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                f"fk_{table_name}_organization_id",
                "organizations",
                ["organization_id"],
                ["id"],
                ondelete="RESTRICT",
            )
            batch_op.create_index(f"ix_{table_name}_organization_id", ["organization_id"])


def downgrade() -> None:
    for table_name in reversed(SCOPED_TABLES):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_index(f"ix_{table_name}_organization_id")
            batch_op.drop_constraint(
                f"fk_{table_name}_organization_id",
                type_="foreignkey",
            )
            batch_op.drop_column("organization_id")
