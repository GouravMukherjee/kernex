terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }

  # Uncomment to use remote state (recommended for production)
  # backend "s3" {
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  #   endpoint                    = "https://nyc3.digitaloceanspaces.com"
  #   region                      = "us-east-1"
  #   bucket                      = "kernex-terraform-state"
  #   key                         = "terraform.tfstate"
  # }
}

provider "digitalocean" {
  token = var.digitalocean_token
}
