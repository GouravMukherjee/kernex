variable "digitalocean_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "kernex"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc3"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "postgres_size" {
  description = "PostgreSQL cluster size (db-s-1vcpu-1gb, db-s-2vcpu-2gb, etc.)"
  type        = string
  default     = "db-s-2vcpu-2gb"
}

variable "app_platform_github_repo" {
  description = "GitHub repository URL for App Platform (e.g., https://github.com/GouravMukherjee/kernex)"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token for App Platform deployment"
  type        = string
  sensitive   = true
}

variable "control_plane_image" {
  description = "Docker image for control plane API"
  type        = string
  default     = "kernex/control-plane:latest"
}

variable "frontend_image" {
  description = "Docker image for frontend"
  type        = string
  default     = "kernex/frontend:latest"
}
