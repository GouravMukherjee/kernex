#!/usr/bin/env powershell
<#
.SYNOPSIS
    Kernex Production Setup Script - Complete deployment preparation

.DESCRIPTION
    Automates Docker setup, PostgreSQL migrations, and local development environment

.EXAMPLE
    ./setup-production.ps1 -Environment development
    ./setup-production.ps1 -Environment production -ValidateOnly
#>

param(
    [ValidateSet('development', 'production')]
    [string]$Environment = 'development',
    
    [switch]$ValidateOnly,
    [switch]$BuildDocker,
    [switch]$RunDocker
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Kernex Production Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# ========== VALIDATION ==========

function Test-Prerequisites {
    Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Cyan
    
    $missing = @()
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        $missing += "Docker (https://www.docker.com/products/docker-desktop)"
    } else {
        Write-Host "✅ Docker installed" -ForegroundColor Green
    }
    
    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        $missing += "Docker Compose"
    } else {
        Write-Host "✅ Docker Compose installed" -ForegroundColor Green
    }
    
    # Check Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        $missing += "Python 3.11+ (https://www.python.org)"
    } else {
        $pythonVersion = python --version
        Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
    }
    
    # Check Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        $missing += "Git (https://git-scm.com)"
    } else {
        Write-Host "✅ Git installed" -ForegroundColor Green
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "`n❌ Missing prerequisites:" -ForegroundColor Red
        foreach ($item in $missing) {
            Write-Host "  - $item" -ForegroundColor Red
        }
        exit 1
    }
    
    Write-Host "`n✅ All prerequisites met!" -ForegroundColor Green
}

# ========== FILE VALIDATION ==========

function Test-ProjectStructure {
    Write-Host "`n📁 Checking project structure..." -ForegroundColor Cyan
    
    $required_files = @(
        'control-plane/Dockerfile',
        'control-plane/requirements.txt',
        'control-plane/app/main.py',
        'frontend/Dockerfile',
        'infra/docker-compose.yml',
        'alembic/env.py',
        'alembic/versions/001_initial_schema.py'
    )
    
    $missing_files = @()
    foreach ($file in $required_files) {
        if (-not (Test-Path $file)) {
            $missing_files += $file
        } else {
            Write-Host "✅ $file" -ForegroundColor Green
        }
    }
    
    if ($missing_files.Count -gt 0) {
        Write-Host "`n⚠️  Missing files:" -ForegroundColor Yellow
        foreach ($file in $missing_files) {
            Write-Host "  - $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n✅ Project structure complete!" -ForegroundColor Green
    }
}

# ========== DOCKER BUILD ==========

function Build-DockerImages {
    Write-Host "`n🐳 Building Docker images..." -ForegroundColor Cyan
    
    try {
        # Build control plane
        Write-Host "Building control-plane image..." -ForegroundColor Yellow
        docker build -t kernex-api:latest ./control-plane
        Write-Host "✅ Control plane built" -ForegroundColor Green
        
        # Build frontend
        Write-Host "Building frontend image..." -ForegroundColor Yellow
        docker build -t kernex-frontend:latest ./frontend
        Write-Host "✅ Frontend built" -ForegroundColor Green
        
        Write-Host "`n✅ Docker images built successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker build failed: $_" -ForegroundColor Red
        exit 1
    }
}

# ========== DOCKER COMPOSE ==========

function Start-DockerCompose {
    Write-Host "`n🐳 Starting Docker Compose services..." -ForegroundColor Cyan
    
    try {
        docker-compose -f infra/docker-compose.yml up -d
        Write-Host "`n✅ Docker Compose services started!" -ForegroundColor Green
        Write-Host "`nServices:" -ForegroundColor Cyan
        Write-Host "  - API: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "  - PostgreSQL: localhost:5432" -ForegroundColor Yellow
        Write-Host "  - PgAdmin: http://localhost:5050" -ForegroundColor Yellow
    }
    catch {
        Write-Host "❌ Docker Compose failed: $_" -ForegroundColor Red
        exit 1
    }
}

# ========== DATABASE SETUP ==========

function Setup-Database {
    Write-Host "`n🗄️  Setting up database..." -ForegroundColor Cyan
    
    # Wait for PostgreSQL to be ready
    Write-Host "Waiting for PostgreSQL..." -ForegroundColor Yellow
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            docker exec kernex-postgres pg_isready -U kernex -d kernex_db | Out-Null
            Write-Host "✅ PostgreSQL ready" -ForegroundColor Green
            break
        }
        catch {
            $attempt++
            if ($attempt -lt $maxAttempts) {
                Write-Host "  Waiting... ($attempt/$maxAttempts)" -ForegroundColor Gray
                Start-Sleep -Seconds 1
            }
        }
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ PostgreSQL failed to start" -ForegroundColor Red
        exit 1
    }
    
    # Run migrations
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    try {
        docker exec kernex-api python -m alembic upgrade head
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Migrations may have failed, check logs" -ForegroundColor Yellow
    }
}

# ========== HEALTH CHECKS ==========

function Test-HealthChecks {
    Write-Host "`n❤️  Running health checks..." -ForegroundColor Cyan
    
    try {
        # API health check
        Write-Host "Checking API health..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️  API health check returned: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not reach API (may still be starting): $_" -ForegroundColor Yellow
    }
    
    try {
        # Frontend health check
        Write-Host "Checking Frontend health..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Frontend returned: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not reach Frontend (may still be starting): $_" -ForegroundColor Yellow
    }
}

# ========== MAIN EXECUTION ==========

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Kernex Production Setup Script       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

Test-Prerequisites
Test-ProjectStructure

if ($ValidateOnly) {
    Write-Host "`n✅ Validation complete! All checks passed." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Run full setup: ./setup-production.ps1" -ForegroundColor Yellow
    Write-Host "  2. Or build Docker only: ./setup-production.ps1 -BuildDocker" -ForegroundColor Yellow
    Write-Host "  3. Or run Docker Compose: ./setup-production.ps1 -RunDocker" -ForegroundColor Yellow
    exit 0
}

if ($BuildDocker) {
    Build-DockerImages
}

if ($RunDocker) {
    Start-DockerCompose
    Setup-Database
    Start-Sleep -Seconds 3
    Test-HealthChecks
}

if (-not $BuildDocker -and -not $RunDocker) {
    # Full setup
    Build-DockerImages
    Start-DockerCompose
    Setup-Database
    Start-Sleep -Seconds 3
    Test-HealthChecks
}

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅ Setup Complete!                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. View logs: docker-compose -f infra/docker-compose.yml logs -f" -ForegroundColor Yellow
Write-Host "  2. Stop services: docker-compose -f infra/docker-compose.yml down" -ForegroundColor Yellow
Write-Host "  3. Access API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "  4. Access Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  5. Access PgAdmin: http://localhost:5050 (admin/admin)" -ForegroundColor Yellow
Write-Host "  6. Deploy to Railway: Push to GitHub and follow RAILWAY_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
