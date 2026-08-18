resource "aws_ecr_repository" "frontend" {
  name                 = "${local.project_name}-frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-frontend"
  })
}

resource "aws_ecr_repository" "backend" {
  name                 = "${local.project_name}-backend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_name}-backend"
  })
}
