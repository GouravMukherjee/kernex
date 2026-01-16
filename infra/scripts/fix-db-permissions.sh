#!/bin/bash

# Fix PostgreSQL permissions for kernex_app user
# This script connects as the default admin user and grants necessary permissions

set -e

# Configuration
DB_HOST="${1:-kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com}"
DB_PORT="${2:-25060}"
DB_NAME="${3:-kernex_db}"
ADMIN_USER="${4:-doadmin}"
ADMIN_PASSWORD="${5}"
APP_USER="kernex_app"

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Usage: $0 <host> <port> <database> <admin_user> <admin_password>"
    echo ""
    echo "Example:"
    echo "  $0 kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com 25060 kernex_db doadmin 'your-password-here'"
    echo ""
    echo "Note: Get the admin password from:"
    echo "  1. DigitalOcean console > Databases > kernex-db-production > Users > doadmin (Read-only)"
    echo "  2. Or check terraform.tfstate for the value"
    exit 1
fi

echo "Connecting to PostgreSQL cluster..."
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  Admin User: $ADMIN_USER"
echo "  App User: $APP_USER"
echo ""

# Export password for psql
export PGPASSWORD="$ADMIN_PASSWORD"

# Function to run SQL command
run_sql() {
    local sql="$1"
    echo "Executing: $sql"
    psql -h "$DB_HOST" \
         -p "$DB_PORT" \
         -U "$ADMIN_USER" \
         -d "$DB_NAME" \
         -c "$sql" \
         --no-password
}

# Grant schema permissions
run_sql "GRANT USAGE ON SCHEMA public TO $APP_USER;"
run_sql "GRANT CREATE ON SCHEMA public TO $APP_USER;"

# Grant table permissions
run_sql "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;"

# Grant sequence permissions (for auto-increment IDs)
run_sql "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;"

# Set default privileges for future tables
run_sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $APP_USER;"
run_sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $APP_USER;"

echo ""
echo "✓ Database permissions fixed successfully!"
echo ""
echo "Next steps:"
echo "  1. Redeploy the control plane application (it will reconnect and create tables)"
echo "  2. Or restart the app in DigitalOcean App Platform console"
