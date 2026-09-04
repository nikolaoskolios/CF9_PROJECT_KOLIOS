"""initial schema

Single baseline migration for the current schema, replacing the previous
three incremental migrations (which documented schema changes made over
time, but were never actually applied via `alembic upgrade` - the live
database was built via Base.metadata.create_all() plus manual column
additions). This file reflects the schema as it exists in models.py today.

Revision ID: a3e1c8f5d2b0
Revises:
Create Date: 2026-09-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3e1c8f5d2b0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SUBSYSTEM_TEST_FIELDS = [
    'superlaser_concentration_static_check',
    'hypermatter_reactor_core_startup_test',
    'sublight_ion_engines_sanity_check',
    'superlaser_focal_lenses_coordination_test',
    'class_3_hyperdrive_coordinate_input_test',
    'deflector_shield_generator_stress_test',
    'turbolaser_ion_cannon_power_on_test',
    'tractor_beam_projectors_response_test',
    'exhaust_ports_control_test',
    'kyber_crystal_sample_response_test',
]


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('api_key_hash', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('api_key_hash'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    op.create_table(
        'test_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('test_date', sa.Date(), nullable=True),
        sa.Column('build', sa.String(), nullable=True),
        sa.Column('overall_test_rate', sa.Float(), nullable=True),
        *[sa.Column(field, sa.Float(), nullable=True) for field in SUBSYSTEM_TEST_FIELDS],
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_test_results_id'), 'test_results', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_test_results_id'), table_name='test_results')
    op.drop_table('test_results')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
