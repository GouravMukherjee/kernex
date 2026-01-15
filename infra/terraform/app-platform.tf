# DigitalOcean App Platform for deployment
# Note: This is a baseline configuration. Customize based on your repository URL.

resource "digitalocean_app" "kernex_app" {
  spec {
    name   = "${var.project_name}-${var.environment}"
    region = var.region

    # Control Plane API Service
    service {
      name             = "control-plane-api"
      github {
        repo           = var.app_platform_github_repo
        branch         = "main"
        deploy_on_push = true
      }
      source_dir = "control-plane"

      build_command = "pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8080"

      envs = [
        {
          key   = "APP_ENV"
          value = var.environment
        },
        {
          key   = "DATABASE_URL"
          value = "postgresql+asyncpg://${digitalocean_database_user.kernex_app_user.name}:${digitalocean_database_user.kernex_app_user.password}@${digitalocean_database_cluster.kernex_postgres.host}:${digitalocean_database_cluster.kernex_postgres.port}/${digitalocean_database_db.kernex_db.name}?sslmode=require"
        },
        {
          key   = "BUNDLE_STORAGE_PATH"
          value = "s3://${digitalocean_spaces_bucket.kernex_bundles.name}"
        },
        {
          key   = "AWS_S3_ENDPOINT"
          value = "${digitalocean_spaces_bucket.kernex_bundles.region}.digitaloceanspaces.com"
        },
        {
          key   = "AWS_S3_REGION"
          value = digitalocean_spaces_bucket.kernex_bundles.region
        },
        {
          key   = "AWS_ACCESS_KEY_ID"
          value = digitalocean_spaces_access_key.kernex_app_key.access_key
        },
        {
          key   = "AWS_SECRET_ACCESS_KEY"
          value = digitalocean_spaces_access_key.kernex_app_key.secret_access_key
        },
      ]

      http_port = 8080
    }

    # Frontend Service (Next.js)
    service {
      name             = "frontend"
      github {
        repo           = var.app_platform_github_repo
        branch         = "main"
        deploy_on_push = true
      }
      source_dir = "frontend"

      build_command = "npm install && npm run build"

      envs = [
        {
          key   = "NEXT_PUBLIC_API_URL"
          value = "https://${digitalocean_app.kernex_app.default_ingress}/api/v1"
        },
      ]

      http_port = 3000
    }

    # HTTP routes
    http {
      path_prefix = "/api/v1"
      routes {
        path                = "/"
        service_component_name = "control-plane-api"
      }
    }

    http {
      routes {
        path                = "/"
        service_component_name = "frontend"
      }
    }
  }
}

output "app_url" {
  description = "DigitalOcean App Platform URL"
  value       = digitalocean_app.kernex_app.default_ingress
}

output "app_name" {
  description = "DigitalOcean App name"
  value       = digitalocean_app.kernex_app.name
}
