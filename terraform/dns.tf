# ---------------------------------------------------------
# Private DNS
# ---------------------------------------------------------

resource "aws_route53_zone" "private" {
  name = "eventsync.internal"

  vpc {
    vpc_id = aws_vpc.main.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-private-dns"
    }
  )
}

resource "aws_route53_record" "logstash" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "logstash.eventsync.internal"
  type    = "A"
  ttl     = 60

  records = [
    aws_instance.observability.private_ip
  ]
}
