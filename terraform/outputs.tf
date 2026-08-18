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
