"""Add organization-scoped cloud artwork references."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0029_web_artwork_storage"
down_revision: str | None = "0028_commercial_organization_scope"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for table_name in ("cloud_files", "artworks"):
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

    with op.batch_alter_table("artwork_versions") as batch_op:
        batch_op.add_column(sa.Column("cloud_file_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("preview_cloud_file_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_artwork_versions_cloud_file_id",
            "cloud_files",
            ["cloud_file_id"],
            ["id"],
            ondelete="RESTRICT",
        )
        batch_op.create_foreign_key(
            "fk_artwork_versions_preview_cloud_file_id",
            "cloud_files",
            ["preview_cloud_file_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index("ix_artwork_versions_cloud_file_id", ["cloud_file_id"])
        batch_op.create_index(
            "ix_artwork_versions_preview_cloud_file_id", ["preview_cloud_file_id"]
        )


def downgrade() -> None:
    with op.batch_alter_table("artwork_versions") as batch_op:
        batch_op.drop_index("ix_artwork_versions_preview_cloud_file_id")
        batch_op.drop_index("ix_artwork_versions_cloud_file_id")
        batch_op.drop_constraint(
            "fk_artwork_versions_preview_cloud_file_id", type_="foreignkey"
        )
        batch_op.drop_constraint("fk_artwork_versions_cloud_file_id", type_="foreignkey")
        batch_op.drop_column("preview_cloud_file_id")
        batch_op.drop_column("cloud_file_id")

    for table_name in ("artworks", "cloud_files"):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_index(f"ix_{table_name}_organization_id")
            batch_op.drop_constraint(
                f"fk_{table_name}_organization_id", type_="foreignkey"
            )
            batch_op.drop_column("organization_id")
