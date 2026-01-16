output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "DigitalOcean region"
  value       = var.region
}

output "app_url" {
  description = "DigitalOcean App Platform URL"
  value       = digitalocean_app.kernex_app.default_ingress
}

output "database_host" {
  description = "PostgreSQL database host"
  value       = digitalocean_database_cluster.kernex_postgres.host
}

output "database_user" {
  description = "PostgreSQL database user"
  value       = digitalocean_database_user.kernex_app_user.name
}

output "database_password" {
  description = "PostgreSQL database password"
  value       = digitalocean_database_user.kernex_app_user.password
  sensitive   = true
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = digitalocean_database_db.kernex_db.name
}

output "database_connection_string" {
  description = "Full PostgreSQL connection string for asyncpg"
  value       = "postgresql+asyncpg://${digitalocean_database_user.kernex_app_user.name}:${digitalocean_database_user.kernex_app_user.password}@${digitalocean_database_cluster.kernex_postgres.host}:${digitalocean_database_cluster.kernex_postgres.port}/${digitalocean_database_db.kernex_db.name}?sslmode=require"
  sensitive   = true
}

output "summary" {
  description = "Deployment summary"
  value = {
    app_url          = digitalocean_app.kernex_app.default_ingress
    database_host    = digitalocean_database_cluster.kernex_postgres.host
    database_port    = digitalocean_database_cluster.kernex_postgres.port
    environment      = var.environment
    region           = var.region
  }
}

output "next_steps" {
  description = "Next steps after deployment"
  value       = <<-EOT
1. Configure App Platform services in DigitalOcean Console:
   - Set DATABASE_URL environment variable
   - Configure build commands for control-plane and frontend
   - Set up routing

2. Create Spaces bucket for bundle storage:
   - Go to Account > API > Spaces Keys
   - Create new access key
   - Add to control plane app

3. Deploy your app:
   - Push to GitHub
   - App Platform will auto-deploy on push
  EOT
}
