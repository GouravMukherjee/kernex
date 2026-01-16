# DigitalOcean App Platform - Basic Configuration
# Note: Full App Platform configuration requires manual setup in the console
# This creates the basic app structure

resource "digitalocean_app" "kernex_app" {
  spec {
    name   = "${var.project_name}-${var.environment}"
    region = var.region
  }
}
