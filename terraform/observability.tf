# ---------------------------------------------------------
# EventSync Observability Host
# ---------------------------------------------------------

# Resolve the latest Amazon Linux 2023 x86_64 AMI dynamically.
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ---------------------------------------------------------
# Security Group
# ---------------------------------------------------------

resource "aws_security_group" "observability" {
  name        = "${local.project_name}-observability"
  description = "Private access to the EventSync observability host"
  vpc_id      = aws_vpc.main.id

  # Filebeat -> Logstash.
  # For the baseline, allow only traffic originating inside the
  # EventSync VPC. We can tighten this further after log shipping works.
  ingress {
    description = "Filebeat to Logstash from EventSync VPC"
    from_port   = 5044
    to_port     = 5044
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  # Outbound access is required for:
  # - SSM
  # - Docker/Elastic image downloads
  # - operating system package installation
  egress {
    description = "Outbound internet through NAT Gateway"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-observability-sg"
    }
  )
}

# ---------------------------------------------------------
# Systems Manager IAM Role
# ---------------------------------------------------------

resource "aws_iam_role" "observability_ssm" {
  name = "${local.project_name}-observability-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "observability_ssm" {
  role       = aws_iam_role.observability_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "observability" {
  name = "${local.project_name}-observability-profile"
  role = aws_iam_role.observability_ssm.name
}

# ---------------------------------------------------------
# EC2 Host
# ---------------------------------------------------------

resource "aws_instance" "observability" {
  ami           = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type = "m7i-flex.large"

  # Keep observability private and close to the EKS workloads.
  subnet_id                   = aws_subnet.private_a.id
  associate_public_ip_address = false

  vpc_security_group_ids = [
    aws_security_group.observability.id
  ]

  iam_instance_profile = aws_iam_instance_profile.observability.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-observability"
      Role = "observability"
    }
  )

  depends_on = [
    aws_route_table_association.private_a,
    aws_iam_role_policy_attachment.observability_ssm
  ]
}
