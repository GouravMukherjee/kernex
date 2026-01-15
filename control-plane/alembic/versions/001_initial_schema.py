"""Initial schema - all tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-01-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Device table
    op.create_table(
        'device',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.String(), nullable=False),
        sa.Column('public_key', sa.String(), nullable=False),
        sa.Column('hardware_metadata', sa.JSON(), nullable=True),
        sa.Column('current_bundle_version', sa.String(), nullable=True),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('device_id'),
        sa.UniqueConstraint('public_key')
    )

    # Bundle table
    op.create_table(
        'bundle',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('checksum_sha256', sa.String(), nullable=False),
        sa.Column('manifest', sa.JSON(), nullable=False),
        sa.Column('storage_path', sa.String(), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version')
    )

    # Deployment table
    op.create_table(
        'deployment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('bundle_id', sa.Integer(), nullable=False),
        sa.Column('target_device_ids', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bundle_id'], ['bundle.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_deployment_status', 'status')
    )

    # Heartbeat table
    op.create_table(
        'heartbeat',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('agent_version', sa.String(), nullable=True),
        sa.Column('memory_mb', sa.Integer(), nullable=True),
        sa.Column('cpu_pct', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_heartbeat_device_timestamp', 'device_id', 'timestamp')
    )

    # DeviceConfig table
    op.create_table(
        'device_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('config_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_device_config_device_version', 'device_id', 'version')
    )

    # DeviceBundleHistory table
    op.create_table(
        'device_bundle_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_id', sa.Integer(), nullable=False),
        sa.Column('bundle_version', sa.String(), nullable=False),
        sa.Column('deployment_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('deployed_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['device.id'], ),
        sa.ForeignKeyConstraint(['deployment_id'], ['deployment.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_device_bundle_history_device', 'device_id'),
        sa.Index('ix_device_bundle_history_deployed_at', 'deployed_at')
    )


def downgrade() -> None:
    op.drop_table('device_bundle_history')
    op.drop_table('device_config')
    op.drop_table('heartbeat')
    op.drop_table('deployment')
    op.drop_table('bundle')
    op.drop_table('device')
