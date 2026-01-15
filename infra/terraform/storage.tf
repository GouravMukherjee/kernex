# DigitalOcean Spaces (S3-compatible object storage)
resource "digitalocean_spaces_bucket" "kernex_bundles" {
  name       = "${var.project_name}-bundles-${var.environment}"
  region     = var.region
  acl        = "private"
  force_destroy = false

  tags = [
    "kernex",
    var.environment
  ]
}

# CORS configuration for bundle uploads
resource "digitalocean_spaces_bucket_cors_configuration" "kernex_cors" {
  bucket = digitalocean_spaces_bucket.kernex_bundles.id
  region = digitalocean_spaces_bucket.kernex_bundles.region

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Spaces API key for control plane
resource "digitalocean_spaces_access_key" "kernex_app_key" {
  spaces_access_key_name = "${var.project_name}-app-key-${var.environment}"
}

output "spaces_bucket_name" {
  description = "Spaces bucket name for bundle storage"
  value       = digitalocean_spaces_bucket.kernex_bundles.name
}

output "spaces_bucket_region" {
  description = "Spaces bucket region"
  value       = digitalocean_spaces_bucket.kernex_bundles.region
}

output "spaces_bucket_endpoint" {
  description = "Spaces bucket endpoint URL"
  value       = "https://${digitalocean_spaces_bucket.kernex_bundles.region}.digitaloceanspaces.com"
}

output "spaces_access_key_id" {
  description = "Spaces access key ID"
  value       = digitalocean_spaces_access_key.kernex_app_key.access_key
  sensitive   = true
}

output "spaces_secret_access_key" {
  description = "Spaces secret access key"
  value       = digitalocean_spaces_access_key.kernex_app_key.secret_access_key
  sensitive   = true
}
