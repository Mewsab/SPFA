"""add user is_active

Revision ID: b71c7b3c9f8a
Revises: a14e750cac51
Create Date: 2026-06-17 01:55:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b71c7b3c9f8a'
down_revision = 'a14e750cac51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column('users', 'is_active')
