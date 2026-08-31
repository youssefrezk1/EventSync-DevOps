output "aws_region" {
  description = "AWS region used by Terraform"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = local.project_name
}

output "environment" {
  description = "Deployment environment"
  value       = local.environment
}

output "frontend_ecr_repository_url" {
  description = "ECR repository URL for the EventSync frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_url" {
  description = "ECR repository URL for the EventSync backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "adaptive_parser_ecr_repository_url" {
  description = "ECR repository URL for the EventSync adaptive parser"
  value       = aws_ecr_repository.adaptive_parser.repository_url
}

output "vpc_id" {
  description = "EventSync VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_node_group_name" {
  description = "EKS managed node group name"
  value       = aws_eks_node_group.main.node_group_name
}

output "load_balancer_controller_role_arn" {
  description = "IAM role ARN used by the AWS Load Balancer Controller"
  value       = aws_iam_role.load_balancer_controller.arn
}

output "github_actions_cd_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions for EventSync CD"
  value       = aws_iam_role.github_actions_cd.arn
}

# ---------------------------------------------------------
# Observability
# ---------------------------------------------------------

output "observability_instance_id" {
  description = "EC2 instance ID for the EventSync observability host"
  value       = aws_instance.observability.id
}

output "observability_private_ip" {
  description = "Private IP address of the EventSync observability host"
  value       = aws_instance.observability.private_ip
}

output "logstash_private_dns" {
  description = "Private DNS name used by Filebeat to reach Logstash"
  value       = aws_route53_record.logstash.fqdn
}
