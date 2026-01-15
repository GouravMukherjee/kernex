# DigitalOcean Managed PostgreSQL Database
resource "digitalocean_database_cluster" "kernex_postgres" {
  name              = "${var.project_name}-db-${var.environment}"
  engine            = "pg"
  version           = var.postgres_version
  region            = var.region
  node_count        = 1
  size              = var.postgres_size
  storage_mb        = 61440 # 60GB
  backup_restore_name = null

  tags = [
    "kernex",
    var.environment
  ]
}

# Database user for Kernex
resource "digitalocean_database_user" "kernex_app_user" {
  cluster_id = digitalocean_database_cluster.kernex_postgres.id
  name       = "kernex_app"
}

# Primary database
resource "digitalocean_database_db" "kernex_db" {
  cluster_id = digitalocean_database_cluster.kernex_postgres.id
  name       = "kernex_db"
}

# Firewall rule to allow App Platform apps to connect
resource "digitalocean_database_firewall" "kernex_fw" {
  cluster_id = digitalocean_database_cluster.kernex_postgres.id

  rule {
    type  = "tag"
    value = "kernex-app"
  }
}

# Export connection string as secret for App Platform
resource "digitalocean_app_spec_output" "postgres_connection_string" {
  # This value will be available to App Platform services
  value = "postgresql+asyncpg://${digitalocean_database_user.kernex_app_user.name}:${digitalocean_database_user.kernex_app_user.password}@${digitalocean_database_cluster.kernex_postgres.host}:${digitalocean_database_cluster.kernex_postgres.port}/${digitalocean_database_db.kernex_db.name}?sslmode=require"
}

output "postgres_host" {
  description = "PostgreSQL cluster host"
  value       = digitalocean_database_cluster.kernex_postgres.host
}

output "postgres_port" {
  description = "PostgreSQL cluster port"
  value       = digitalocean_database_cluster.kernex_postgres.port
}

output "postgres_user" {
  description = "PostgreSQL user"
  value       = digitalocean_database_user.kernex_app_user.name
}

output "postgres_password" {
  description = "PostgreSQL user password"
  value       = digitalocean_database_user.kernex_app_user.password
  sensitive   = true
}

output "postgres_database" {
  description = "PostgreSQL database name"
  value       = digitalocean_database_db.kernex_db.name
}

output "postgres_connection_string" {
  description = "Full PostgreSQL connection string for asyncpg"
  value       = "postgresql+asyncpg://${digitalocean_database_user.kernex_app_user.name}:${digitalocean_database_user.kernex_app_user.password}@${digitalocean_database_cluster.kernex_postgres.host}:${digitalocean_database_cluster.kernex_postgres.port}/${digitalocean_database_db.kernex_db.name}?sslmode=require"
  sensitive   = true
}
