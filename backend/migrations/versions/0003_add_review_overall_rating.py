"""Add an optional overall star rating to written reviews."""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Batch mode uses SQLite's copy-and-move strategy in tests and ordinary
    # ALTER TABLE operations on databases such as PostgreSQL.
    with op.batch_alter_table("reviews") as batch_op:
        batch_op.add_column(sa.Column("overall_rating", sa.Integer(), nullable=True))
        batch_op.create_check_constraint(
            "ck_reviews_overall_rating",
            "overall_rating IS NULL OR overall_rating BETWEEN 1 AND 5",
        )


def downgrade() -> None:
    with op.batch_alter_table("reviews") as batch_op:
        batch_op.drop_constraint("ck_reviews_overall_rating", type_="check")
        batch_op.drop_column("overall_rating")
