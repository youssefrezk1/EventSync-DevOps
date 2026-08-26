import re

from app.log_redactor import LogRedactor


class LogNormalizer:
    """
    Produces a deterministic structural representation of a canonical
    log message.

    The original raw log remains unchanged.

    Normalization combines two independent local capabilities:

      1. sensitive-value normalization;
      2. ordinary runtime-value normalization.

    Sensitive-value recognition is delegated to LogRedactor so the
    normalizer does not duplicate security-pattern definitions.
    """

    ISO_TIMESTAMP = re.compile(
        r"\b\d{4}-\d{2}-\d{2}T"
        r"\d{2}:\d{2}:\d{2}"
        r"(?:\.\d+)?Z\b"
    )

    UUID = re.compile(
        r"\b[0-9a-fA-F]{8}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{12}\b"
    )

    IPV4 = re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    )

    INTEGER = re.compile(
        r"\d+"
    )

    def __init__(
        self,
        sensitive_normalizer=None,
    ):
        self.sensitive_normalizer = (
            sensitive_normalizer
            or LogRedactor()
        )

    def normalize(
        self,
        message,
    ):
        if not isinstance(
            message,
            str,
        ):
            raise TypeError(
                "Log message must be a string."
            )

        # -----------------------------------------------------
        # Normalize sensitive runtime values first.
        #
        # This reuses the existing security capability rather
        # than duplicating sensitive-pattern definitions here.
        # -----------------------------------------------------

        normalized = (
            self.sensitive_normalizer.redact(
                message
            )
        )

        # -----------------------------------------------------
        # Normalize ordinary deterministic runtime structures.
        #
        # Order matters: structured values must be handled
        # before generic numbers.
        # -----------------------------------------------------

        normalized = self.ISO_TIMESTAMP.sub(
            "<TIMESTAMP>",
            normalized,
        )

        normalized = self.UUID.sub(
            "<UUID>",
            normalized,
        )

        normalized = self.IPV4.sub(
            "<IP>",
            normalized,
        )

        normalized = self.INTEGER.sub(
            "<NUM>",
            normalized,
        )

        return normalized
