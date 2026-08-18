variable "aws_region" {
  description = "AWS region where EventSync infrastructure will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the EventSync VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones used by EventSync"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}
