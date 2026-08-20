# ---------------------------------------------------------
# EKS Managed Add-ons
# ---------------------------------------------------------

resource "aws_eks_addon" "vpc_cni" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = "v1.22.4-eksbuild.3"

  # Adopt the existing self-managed VPC CNI installation.
  resolve_conflicts_on_create = "OVERWRITE"

  # Preserve explicitly managed/custom settings on future updates.
  resolve_conflicts_on_update = "PRESERVE"

  configuration_values = jsonencode({
    enableNetworkPolicy = "true"

    env = {
      NETWORK_POLICY_ENFORCING_MODE = "standard"
    }
  })

  depends_on = [
    aws_eks_cluster.main
  ]

  tags = local.common_tags
}

# ---------------------------------------------------------
# Metrics Server
# ---------------------------------------------------------

resource "aws_eks_addon" "metrics_server" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "metrics-server"
  addon_version = "v0.8.1-eksbuild.14"

  resolve_conflicts_on_update = "PRESERVE"

  depends_on = [
    aws_eks_cluster.main
  ]

  tags = local.common_tags
}
