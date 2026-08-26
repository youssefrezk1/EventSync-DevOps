import re


class LogRedactor:
    """
    Removes security-sensitive values before log samples are sent
    to an external template-generation provider.

    This is deliberately separate from LogNormalizer:

    - LogNormalizer prepares messages for clustering.
    - LogRedactor protects sensitive information.
    """

    EMAIL = re.compile(
        r"\b[A-Za-z0-9._%+-]+@"
        r"[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    )

    AUTHORIZATION_HEADER = re.compile(
        r"(?i)"
        r"\bAuthorization"
        r"(\s*[:=]\s*)"
        r"(?:Bearer\s+)?"
        r"[^\s,;]+"
    )

    BEARER_TOKEN = re.compile(
        r"(?i)(\bBearer\s+)"
        r"[A-Za-z0-9._~+/=-]+"
    )

    JWT = re.compile(
        r"\beyJ[A-Za-z0-9_-]+"
        r"\.[A-Za-z0-9_-]+"
        r"\.[A-Za-z0-9_-]+\b"
    )

    SENSITIVE_ASSIGNMENT = re.compile(
        r"""(?ix)
        \b(
            password
            |passwd
            |pwd
            |api[_-]?key
            |access[_-]?token
            |refresh[_-]?token
            |secret
            |client[_-]?secret
        )
        (\s*[:=]\s*)
        (?:
            "[^"]*"
            |
            '[^']*'
            |
            [^\s,;]+
        )
        """
    )

    def redact(self, message):
        if not isinstance(message, str):
            raise TypeError(
                "Log message must be a string."
            )

        redacted = message

        # Handle Authorization as one atomic sensitive field so
        # Bearer + token are never partially redacted.
        redacted = self.AUTHORIZATION_HEADER.sub(
            lambda match: (
                "Authorization"
                f"{match.group(1)}"
                "<SECRET>"
            ),
            redacted,
        )

        # Protect standalone JWTs.
        redacted = self.JWT.sub(
            "<SECRET>",
            redacted,
        )

        # Protect Bearer tokens that appear outside an
        # Authorization assignment/header.
        redacted = self.BEARER_TOKEN.sub(
            r"\1<SECRET>",
            redacted,
        )

        redacted = self.EMAIL.sub(
            "<EMAIL>",
            redacted,
        )

        redacted = self.SENSITIVE_ASSIGNMENT.sub(
            lambda match: (
                f"{match.group(1)}"
                f"{match.group(2)}"
                "<SECRET>"
            ),
            redacted,
        )

        return redacted
