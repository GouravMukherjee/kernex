# Fix PostgreSQL permissions for kernex_app user on DigitalOcean
# This script connects as the default admin user and grants necessary permissions
# Requires: psql (PostgreSQL CLI) installed and in PATH

param(
    [string]$DbHost = "kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com",
    [int]$DbPort = 25060,
    [string]$DbName = "kernex_db",
    [string]$AdminUser = "doadmin",
    [string]$AdminPassword = $null,
    [string]$AppUser = "kernex_app"
)

if ([string]::IsNullOrEmpty($AdminPassword)) {
    Write-Host "Usage: .\fix-db-permissions.ps1 -AdminPassword <password>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Cyan
    Write-Host '  .\fix-db-permissions.ps1 -AdminPassword "your-doadmin-password"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "To get admin password:" -ForegroundColor Cyan
    Write-Host "  1. DigitalOcean console > Databases > kernex-db-production > Users > doadmin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Prerequisites:" -ForegroundColor Cyan
    Write-Host "  - PostgreSQL client (psql) must be installed" -ForegroundColor Gray
    exit 1
}

# Verify psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: psql not found in PATH" -ForegroundColor Red
    Write-Host "Install PostgreSQL client: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Connecting to PostgreSQL cluster..." -ForegroundColor Green
Write-Host "  Host: $DbHost"
Write-Host "  Port: $DbPort"
Write-Host "  Database: $DbName"
Write-Host "  Admin User: $AdminUser"
Write-Host "  App User: $AppUser"
Write-Host ""

# Function to run SQL command
function Run-Sql {
    param([string]$Sql)
    Write-Host "Executing: $Sql" -ForegroundColor Gray
    
    $env:PGPASSWORD = $AdminPassword
    psql -h $DbHost `
         -p $DbPort `
         -U $AdminUser `
         -d $DbName `
         -c $Sql `
         --no-password
    
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}

# Grant schema permissions
Run-Sql "GRANT USAGE ON SCHEMA public TO $AppUser;"
Run-Sql "GRANT CREATE ON SCHEMA public TO $AppUser;"

# Grant table permissions
Run-Sql "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $AppUser;"

# Grant sequence permissions (for auto-increment IDs)
Run-Sql "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $AppUser;"

# Set default privileges for future tables
Run-Sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $AppUser;"
Run-Sql "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO $AppUser;"

Write-Host ""
Write-Host "Done! Database permissions fixed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next: Redeploy the app in DigitalOcean App Platform console" -ForegroundColor Cyan
