"""Track customer synchronization with the KMS ERP."""

from alembic import op
import sqlalchemy as sa


revision = "e3b7a1c4d9f2"
down_revision = "d9a6c2f7b1e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("erp_customer_id", sa.String(length=80), nullable=True))
    op.add_column("customers", sa.Column("erp_sync_status", sa.String(length=24), nullable=False, server_default="pending"))
    op.add_column("customers", sa.Column("erp_sync_error", sa.String(length=500), nullable=True))
    op.add_column("customers", sa.Column("erp_synced_at", sa.DateTime(), nullable=True))
    op.create_index(op.f("ix_customers_erp_customer_id"), "customers", ["erp_customer_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_customers_erp_customer_id"), table_name="customers")
    op.drop_column("customers", "erp_synced_at")
    op.drop_column("customers", "erp_sync_error")
    op.drop_column("customers", "erp_sync_status")
    op.drop_column("customers", "erp_customer_id")
