# Copy this file to terraform.tfvars and fill in your values
# DO NOT commit terraform.tfvars to Git (it contains secrets)
# Use environment variables instead: TF_VAR_digitalocean_token, TF_VAR_github_token

digitalocean_token         = "REDACTED"
app_platform_github_repo   = "https://github.com/GouravMukherjee/kernex"
github_token               = "REDACTED"
project_name               = "kernex"
region                     = "sfo3"  # nyc3, sfo3, lon1, etc.
environment                = "production"  # MUST be lowercase
postgres_version           = "15"
postgres_size              = "db-s-2vcpu-4gb"  # Changed from db-s-2vcpu-2gb
