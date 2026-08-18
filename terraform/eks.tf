# ---------------------------------------------------------
# EKS Cluster
# ---------------------------------------------------------

resource "aws_eks_cluster" "main" {
  name     = "${local.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn

  version = "1.33"

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
