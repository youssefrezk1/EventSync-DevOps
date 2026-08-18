# ---------------------------------------------------------
# EKS Cluster
# ---------------------------------------------------------

resource "aws_eks_cluster" "main" {
  name     = "${local.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn

  version = "1.33"

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    subnet_ids = [
      aws_subnet.private_a.id,
      aws_subnet.private_b.id
    ]

    endpoint_private_access = true
    endpoint_public_access  = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-cluster"
    }
  )

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}
