#!/usr/bin/env python3

import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

PASS = {"success", "passed", "pass"}
FAIL = {"failure", "failed", "fail"}


def read_json(path):
    p = Path(path)
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text())
    except Exception:
        return {}


def safe(value, default="N/A"):
    if value is None or value == "":
        return default
    return str(value)


def normalize_status(value):
    value = safe(value, "unknown").lower()

    if value in PASS:
        return "PASS"
    if value in FAIL:
        return "FAIL"
    if value == "skipped":
        return "SKIPPED"

    return value.upper()


def vulnerability_rows(report):
    rows = []

    for result in report.get("Results", []) or []:
        target = result.get("Target", "Unknown")

        for vuln in result.get("Vulnerabilities", []) or []:
            rows.append({
                "target": target,
                "id": vuln.get("VulnerabilityID", "N/A"),
                "pkg": vuln.get("PkgName", "N/A"),
                "installed": vuln.get("InstalledVersion", "N/A"),
                "fixed": vuln.get("FixedVersion", "N/A"),
                "severity": vuln.get("Severity", "N/A"),
                "title": vuln.get("Title", ""),
            })

    return rows


def count_by_severity(rows):
    result = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "UNKNOWN": 0,
    }

    for row in rows:
        severity = row["severity"].upper()
        result[severity] = result.get(severity, 0) + 1

    return result


def add_header(story, styles, title, subtitle):
    story.append(
        Paragraph(
            "EVENTSYNC DEVOPS",
            ParagraphStyle(
                "brand",
                parent=styles["Normal"],
                fontSize=10,
                leading=12,
                textColor=colors.HexColor("#6B7280"),
                alignment=TA_CENTER,
                spaceAfter=6,
            ),
        )
    )

    story.append(
        Paragraph(
            title,
            ParagraphStyle(
                "title2",
                parent=styles["Title"],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor("#111827"),
                alignment=TA_CENTER,
                spaceAfter=6,
            ),
        )
    )

    story.append(
        Paragraph(
            subtitle,
            ParagraphStyle(
                "subtitle",
                parent=styles["Normal"],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#6B7280"),
                alignment=TA_CENTER,
                spaceAfter=16,
            ),
        )
    )


def make_metadata_table(metadata):
    rows = [
        ["Repository", safe(metadata.get("repository"))],
        ["Branch", safe(metadata.get("branch"))],
        ["Commit", safe(metadata.get("commit"))],
        ["Triggered by", safe(metadata.get("actor"))],
        ["Environment", safe(metadata.get("environment"), "Development")],
        ["AWS Region", safe(metadata.get("aws_region"), "us-east-1")],
        ["EKS Cluster", safe(metadata.get("eks_cluster"), "eventsync-cluster")],
        ["Application", safe(metadata.get("app_url"))],
        ["Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")],
    ]

    table = Table(rows, colWidths=[42 * mm, 130 * mm])

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#4B5563")),
            ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ])
    )

    return table


def make_status_table(results):
    rows = [["Stage", "Result"]]

    for name, result in results:
        rows.append([name, normalize_status(result)])

    table = Table(rows, colWidths=[120 * mm, 52 * mm])

    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]

    for index, (_, result) in enumerate(results, start=1):
        normalized = normalize_status(result)

        if normalized == "PASS":
            style.append(
                ("TEXTCOLOR", (1, index), (1, index), colors.HexColor("#15803D"))
            )
        elif normalized == "FAIL":
            style.append(
                ("TEXTCOLOR", (1, index), (1, index), colors.HexColor("#B91C1C"))
            )
        elif normalized == "SKIPPED":
            style.append(
                ("TEXTCOLOR", (1, index), (1, index), colors.HexColor("#6B7280"))
            )

    table.setStyle(TableStyle(style))
    return table


def make_vulnerability_table(rows):
    data = [["Severity", "CVE", "Package", "Installed", "Fixed", "Target"]]

    for row in rows[:80]:
        data.append([
            row["severity"],
            row["id"],
            row["pkg"],
            row["installed"],
            row["fixed"],
            row["target"],
        ])

    table = Table(
        data,
        repeatRows=1,
        colWidths=[
            18 * mm,
            29 * mm,
            32 * mm,
            26 * mm,
            26 * mm,
            42 * mm,
        ],
    )

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 6.5),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E5E7EB")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ])
    )

    return table


def build_main_report(output, metadata, statuses, failure_text):
    styles = getSampleStyleSheet()

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    story = []

    overall = "SUCCESS"
    for _, status in statuses:
        if normalize_status(status) == "FAIL":
            overall = "FAILED"
            break

    add_header(
        story,
        styles,
        "EventSync CI/CD Report",
        f"Overall pipeline status: {overall}",
    )

    story.append(make_metadata_table(metadata))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Pipeline Results", styles["Heading2"]))
    story.append(Spacer(1, 5))
    story.append(make_status_table(statuses))

    if failure_text.strip():
        story.append(Spacer(1, 14))
        story.append(Paragraph("Failure Details", styles["Heading2"]))
        story.append(
            Paragraph(
                failure_text.replace("\n", "<br/>"),
                ParagraphStyle(
                    "failure",
                    parent=styles["BodyText"],
                    fontSize=8,
                    leading=11,
                    textColor=colors.HexColor("#991B1B"),
                    backColor=colors.HexColor("#FEF2F2"),
                    borderPadding=8,
                    spaceBefore=4,
                ),
            )
        )

    doc.build(story)


def build_security_report(output, metadata, reports):
    styles = getSampleStyleSheet()

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    story = []

    add_header(
        story,
        styles,
        "EventSync Security Report",
        "Trivy filesystem and container-image vulnerability results",
    )

    story.append(make_metadata_table(metadata))
    story.append(Spacer(1, 12))

    for index, (title, report) in enumerate(reports):
        rows = vulnerability_rows(report)
        counts = count_by_severity(rows)

        story.append(Paragraph(title, styles["Heading2"]))
        story.append(
            Paragraph(
                "Critical: {critical} | High: {high} | Medium: {medium} | "
                "Low: {low} | Total: {total}".format(
                    critical=counts.get("CRITICAL", 0),
                    high=counts.get("HIGH", 0),
                    medium=counts.get("MEDIUM", 0),
                    low=counts.get("LOW", 0),
                    total=len(rows),
                ),
                styles["BodyText"],
            )
        )
        story.append(Spacer(1, 6))

        if rows:
            story.append(make_vulnerability_table(rows))
        else:
            story.append(
                Paragraph(
                    "No vulnerabilities were present in the report.",
                    styles["BodyText"],
                )
            )

        if index != len(reports) - 1:
            story.append(PageBreak())

    doc.build(story)


def build_deployment_report(output, metadata, diagnostics):
    styles = getSampleStyleSheet()

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    story = []

    add_header(
        story,
        styles,
        "EventSync Deployment Report",
        "Amazon EKS deployment and public application verification",
    )

    story.append(make_metadata_table(metadata))
    story.append(Spacer(1, 12))

    for heading, path in diagnostics:
        p = Path(path)

        if not p.exists():
            continue

        text = p.read_text(errors="replace").strip()

        if not text:
            continue

        story.append(Paragraph(heading, styles["Heading2"]))
        story.append(
            Paragraph(
                text.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\n", "<br/>"),
                ParagraphStyle(
                    f"diag-{heading}",
                    parent=styles["Code"],
                    fontSize=6.5,
                    leading=8.5,
                    backColor=colors.HexColor("#F9FAFB"),
                    borderPadding=6,
                ),
            )
        )
        story.append(Spacer(1, 10))

    doc.build(story)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--failure", required=True)
    parser.add_argument("--reports-dir", default="reports")
    args = parser.parse_args()

    out_dir = Path(args.reports_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    metadata = read_json(args.metadata)
    status = read_json(args.status)

    failure_path = Path(args.failure)
    failure_text = ""
    if failure_path.exists():
        failure_text = failure_path.read_text(errors="replace")

    statuses = [
        ("Secret Security", status.get("security")),
        ("Trivy Filesystem", status.get("trivy_filesystem")),
        ("Frontend CI", status.get("frontend")),
        ("Backend CI", status.get("backend")),
        ("Docker Security", status.get("docker_security")),
        ("Compose Validation", status.get("compose")),
        ("Integration Test", status.get("integration")),
        ("CI Gate", status.get("ci_gate")),
        ("Deployment", status.get("deployment")),
    ]

    build_main_report(
        out_dir / "EventSync-CI-CD-Report.pdf",
        metadata,
        statuses,
        failure_text,
    )

    security_reports = [
        ("Filesystem Scan", read_json(out_dir / "trivy-filesystem.json")),
        ("Frontend Image Scan", read_json(out_dir / "trivy-frontend.json")),
        ("Backend Image Scan", read_json(out_dir / "trivy-backend.json")),
    ]

    build_security_report(
        out_dir / "EventSync-Security-Report.pdf",
        metadata,
        security_reports,
    )

    diagnostics = [
        ("Deployments", out_dir / "kubectl-deployments.txt"),
        ("Pods", out_dir / "kubectl-pods.txt"),
        ("Ingress", out_dir / "kubectl-ingress.txt"),
        ("Kubernetes Events", out_dir / "kubectl-events.txt"),
        ("Backend Logs", out_dir / "backend-logs.txt"),
        ("Frontend Logs", out_dir / "frontend-logs.txt"),
    ]

    build_deployment_report(
        out_dir / "EventSync-Deployment-Report.pdf",
        metadata,
        diagnostics,
    )

    print("Generated EventSync PDF reports.")


if __name__ == "__main__":
    main()
