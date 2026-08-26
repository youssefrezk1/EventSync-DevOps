from app.log_event import CanonicalLogEvent


class LogSignature:
    """
    Builds a coarse, application-independent structural signature.

    The signature uses canonical fields when available rather than
    assuming a particular raw log syntax.

    Signature boundaries intentionally avoid source/service metadata.
    Different logging frameworks frequently populate source fields
    differently for the same conceptual event.

    Token normalization is Unicode-aware and does not assume English
    or ASCII application vocabulary.
    """

    def build(self, event):
        if not isinstance(
            event,
            CanonicalLogEvent,
        ):
            raise TypeError(
                "LogSignature.build() requires "
                "a CanonicalLogEvent."
            )

        parts = []

        if event.level:
            parts.append(
                f"level={self._normalize_value(event.level)}"
            )

        root = self._message_root(
            event.message
        )

        if root:
            parts.append(
                f"root={root}"
            )

        if not parts:
            return "unknown"

        return "|".join(parts)

    def _message_root(self, message):
        if not message:
            return None

        for token in message.split():
            cleaned = self._clean_token(
                token
            )

            if not cleaned:
                continue

            if self._looks_like_placeholder(
                cleaned
            ):
                continue

            if self._looks_like_number(
                cleaned
            ):
                continue

            return cleaned.casefold()

        return None

    def _clean_token(self, token):
        """
        Preserve Unicode letters and numbers.

        Also preserve a small set of structurally useful characters.

        This deliberately avoids ASCII-only regular expressions so
        roots can be discovered from Arabic, accented Latin, CJK,
        Cyrillic, and other Unicode scripts.
        """

        allowed_punctuation = {
            "_",
            ".",
            "-",
        }

        return "".join(
            character
            for character in token
            if (
                character.isalnum()
                or character in allowed_punctuation
            )
        )

    def _looks_like_placeholder(self, token):
        upper = token.upper()

        return upper in {
            "TIMESTAMP",
            "NUM",
            "IP",
            "UUID",
            "EMAIL",
            "SECRET",
            "ENTITY",
            "VAR",
        }

    def _looks_like_number(self, token):
        compact = token.replace(
            ".",
            "",
        ).replace(
            "-",
            "",
        )

        return (
            bool(compact)
            and compact.isdigit()
        )

    def _normalize_value(self, value):
        return str(value).strip().casefold()
