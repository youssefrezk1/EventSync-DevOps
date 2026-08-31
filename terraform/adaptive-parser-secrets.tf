# ---------------------------------------------------------
# Adaptive Parser Provider Credentials
#
# Terraform creates only the secret container.
# The secret VALUE must be populated outside Terraform so
# provider credentials never enter Terraform state.
# ---------------------------------------------------------

resource "aws_secretsmanager_secret" "adaptive_parser_providers" {
  name = "${local.project_name}-adaptive-parser-providers"

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-adaptive-parser-providers"
  })
}

resource "aws_iam_role_policy" "observability_adaptive_parser_secrets" {
  name = "${local.project_name}-observability-adaptive-parser-secrets"
  role = aws_iam_role.observability_ssm.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "ReadAdaptiveParserProviderCredentials"
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue"
        ]

        Resource = aws_secretsmanager_secret.adaptive_parser_providers.arn
      }
    ]
  })
}
