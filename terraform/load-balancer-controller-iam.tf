resource "aws_iam_policy" "load_balancer_controller" {
  name        = "${local.project_name}-AWSLoadBalancerControllerIAMPolicy"
  description = "IAM permissions for the EventSync AWS Load Balancer Controller"

  policy = file("${path.module}/aws-load-balancer-controller-policy.json")

  tags = local.common_tags
}

locals {
  eks_oidc_provider_host = replace(
    aws_eks_cluster.main.identity[0].oidc[0].issuer,
    "https://",
    ""
  )
}

resource "aws_iam_role" "load_balancer_controller" {
  name = "${local.project_name}-aws-load-balancer-controller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "${local.eks_oidc_provider_host}:aud" = "sts.amazonaws.com"

            "${local.eks_oidc_provider_host}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "load_balancer_controller" {
  role       = aws_iam_role.load_balancer_controller.name
  policy_arn = aws_iam_policy.load_balancer_controller.arn
}
