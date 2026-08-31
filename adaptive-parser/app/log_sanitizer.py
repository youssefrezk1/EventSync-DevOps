import re


class LogSanitizer:
    """
    Removes transport/display artifacts before a log enters the
    adaptive parsing engine.

    This is intentionally separate from LogNormalizer:
    normalization creates structural learning representations,
    while sanitization cleans the canonical message itself.
    """

    ANSI_ESCAPE = re.compile(
        r"\x1B(?:"
        r"[@-Z\\-_]"
        r"|"
        r"\[[0-?]*[ -/]*[@-~]"
        r")"
    )

    def sanitize(self, message):
        if not isinstance(message, str):
            raise TypeError(
                "Log message must be a string."
            )

        return self.ANSI_ESCAPE.sub(
            "",
            message,
        )
