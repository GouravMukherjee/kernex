output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "DigitalOcean region"
  value       = var.region
}

output "control_plane_url" {
  description = "Control Plane API URL"
  value       = "https://${digitalocean_app.kernex_app.default_ingress}/api/v1"
}

output "frontend_url" {
  description = "Frontend dashboard URL"
  value       = "https://${digitalocean_app.kernex_app.default_ingress}"
}

output "database_credentials" {
  description = "Database credentials (SENSITIVE)"
  value = {
    host               = digitalocean_database_cluster.kernex_postgres.host
    port               = digitalocean_database_cluster.kernex_postgres.port
    username           = digitalocean_database_user.kernex_app_user.name
    password           = digitalocean_database_user.kernex_app_user.password
    database           = digitalocean_database_db.kernex_db.name
    connection_string  = "postgresql+asyncpg://${digitalocean_database_user.kernex_app_user.name}:${digitalocean_database_user.kernex_app_user.password}@${digitalocean_database_cluster.kernex_postgres.host}:${digitalocean_database_cluster.kernex_postgres.port}/${digitalocean_database_db.kernex_db.name}?sslmode=require"
  }
  sensitive = true
}

output "storage_credentials" {
  description = "Storage (Spaces) credentials (SENSITIVE)"
  value = {
    bucket_name       = digitalocean_spaces_bucket.kernex_bundles.name
    region            = digitalocean_spaces_bucket.kernex_bundles.region
    endpoint          = "${digitalocean_spaces_bucket.kernex_bundles.region}.digitaloceanspaces.com"
    access_key_id     = digitalocean_spaces_access_key.kernex_app_key.access_key
    secret_access_key = digitalocean_spaces_access_key.kernex_app_key.secret_access_key
  }
  sensitive = true
}

output "summary" {
  description = "Deployment summary"
  value = {
    app_url                = "https://${digitalocean_app.kernex_app.default_ingress}"
    control_plane_url      = "https://${digitalocean_app.kernex_app.default_ingress}/api/v1"
    database_host          = digitalocean_database_cluster.kernex_postgres.host
    storage_bucket         = digitalocean_spaces_bucket.kernex_bundles.name
    environment            = var.environment
    region                 = var.region
  }
}
