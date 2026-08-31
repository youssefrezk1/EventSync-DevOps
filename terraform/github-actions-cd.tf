# ---------------------------------------------------------
# GitHub Actions OIDC provider already exists in this account
# ---------------------------------------------------------

data "aws_iam_openid_connect_provider" "github" {
  arn = "arn:aws:iam::350769147036:oidc-provider/token.actions.githubusercontent.com"
}


# ---------------------------------------------------------
# GitHub Actions EventSync CD Role
# ---------------------------------------------------------

resource "aws_iam_role" "github_actions_cd" {
  name = "GitHubActions-EventSync-Deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"

            "token.actions.githubusercontent.com:sub" = "repo:youssefrezk1@195547752/EventSync-DevOps@1336141420:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}


# ---------------------------------------------------------
# GitHub Actions CD AWS permissions
# ---------------------------------------------------------

resource "aws_iam_policy" "github_actions_cd" {
  name        = "EventSyncGitHubActionsCDPolicy"
  description = "AWS permissions used by EventSync GitHub Actions CD"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "ECRAuthorization"
        Effect = "Allow"

        Action = [
          "ecr:GetAuthorizationToken"
        ]

        Resource = "*"
      },

      {
        Sid    = "PushEventSyncImages"
        Effect = "Allow"

        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]

        Resource = [
          aws_ecr_repository.frontend.arn,
          aws_ecr_repository.backend.arn,
          aws_ecr_repository.adaptive_parser.arn
        ]
      },

      {
        Sid    = "FindObservabilityInstance"
        Effect = "Allow"

        Action = [
          "ec2:DescribeInstances"
        ]

        Resource = "*"
      },
      {
        Sid    = "DeployAdaptiveParserViaSSM"
        Effect = "Allow"

        Action = [
          "ssm:SendCommand"
        ]

        Resource = [
          aws_instance.observability.arn,
          "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript"
        ]
      },
      {
        Sid    = "ReadAdaptiveParserCommandResult"
        Effect = "Allow"

        Action = [
          "ssm:GetCommandInvocation"
        ]

        Resource = "*"
      },
      {
        Sid    = "DescribeEventSyncCluster"
        Effect = "Allow"

        Action = [
          "eks:DescribeCluster"
        ]

        Resource = aws_eks_cluster.main.arn
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "github_actions_cd" {
  role       = aws_iam_role.github_actions_cd.name
  policy_arn = aws_iam_policy.github_actions_cd.arn
}


# ---------------------------------------------------------
# EKS Access Entry
# ---------------------------------------------------------

resource "aws_eks_access_entry" "github_actions_cd" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.github_actions_cd.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "github_actions_cd" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.github_actions_cd.arn

  policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"

  access_scope {
    type       = "namespace"
    namespaces = ["eventsync"]
  }

  depends_on = [
    aws_eks_access_entry.github_actions_cd
  ]
}
