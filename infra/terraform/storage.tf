# DigitalOcean Spaces (S3-compatible object storage)
# Temporarily disabled - requires AWS credentials configuration
# Uncomment after configuring AWS credentials in terraform.tfvars
/*
resource "digitalocean_spaces_bucket" "kernex_bundles" {
  name          = "${var.project_name}-bundles-${var.environment}"
  region        = var.region
  acl           = "private"
  force_destroy = false
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
*/

# Note: Create Spaces access keys manually in DigitalOcean Console
# Account > API > Spaces Keys > Create New Key
