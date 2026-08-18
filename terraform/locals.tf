locals {
  project_name = "eventsync"
  environment  = "dev"

  common_tags = {
    Project     = "EventSync"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
