import json
import re

from app.log_event import CanonicalLogEvent


class LogAdapter:
    """
    Converts heterogeneous raw log inputs into a common internal
    representation.

    Recognition is based on structural log envelopes rather than
    programming languages or application-specific vocabulary.

    Supported initial forms:
      - JSON
      - structured key=value
      - conventional delimited text
      - conventional level-prefixed text
      - arbitrary plain text
    """

    LEVEL_PATTERN = (
        r"TRACE|DEBUG|INFO|WARN|WARNING|ERROR|"
        r"CRITICAL|FATAL"
    )

    LEVELS = {
        "TRACE",
        "DEBUG",
        "INFO",
        "WARN",
        "WARNING",
        "ERROR",
        "CRITICAL",
        "FATAL",
    }

    ISO_TIMESTAMP = re.compile(
        r"\b\d{4}-\d{2}-\d{2}T"
        r"\d{2}:\d{2}:\d{2}"
        r"(?:\.\d+)?Z\b"
    )

    SIMPLE_TIMESTAMP = re.compile(
        r"\b\d{4}-\d{2}-\d{2}"
        r"[ T]"
        r"\d{2}:\d{2}:\d{2}"
        r"(?:[.,]\d+)?\b"
    )

    KEY_VALUE = re.compile(
        r'([A-Za-z_][A-Za-z0-9_.@-]*)='
        r'(?:"([^"]*)"|\'([^\']*)\'|([^\s]+))'
    )

    STRUCTURED_KEYS = {
        "time",
        "timestamp",
        "@timestamp",
        "level",
        "severity",
        "log_level",
        "message",
        "msg",
        "log",
        "service",
        "source",
        "component",
        "logger",
    }

    # Example:
    #
    # 2026-08-25 13:01:00,123 - database - ERROR - message
    #
    DELIMITED_TEXT = re.compile(
        rf"^(?P<timestamp>"
        rf"\d{{4}}-\d{{2}}-\d{{2}}[ T]"
        rf"\d{{2}}:\d{{2}}:\d{{2}}"
        rf"(?:[.,]\d+)?)"
        rf"\s*-\s*"
        rf"(?P<source>.+?)"
        rf"\s*-\s*"
        rf"(?P<level>{LEVEL_PATTERN})"
        rf"\s*-\s*"
        rf"(?P<message>.+)$",
        re.IGNORECASE,
    )

    # Example:
    #
    # 2026-08-25 13:01:00.331 ERROR DatabaseService - message
    #
    SOURCE_AFTER_LEVEL = re.compile(
        rf"^(?P<timestamp>"
        rf"\d{{4}}-\d{{2}}-\d{{2}}[ T]"
        rf"\d{{2}}:\d{{2}}:\d{{2}}"
        rf"(?:[.,]\d+)?)"
        rf"\s+"
        rf"(?P<level>{LEVEL_PATTERN})"
        rf"\s+"
        rf"(?P<source>[^\s]+)"
        rf"\s+-\s+"
        rf"(?P<message>.+)$",
        re.IGNORECASE,
    )

    # Example:
    #
    # 2026-08-25T13:01:00Z ERROR database timeout
    #
    TIMESTAMP_LEVEL_TEXT = re.compile(
        rf"^(?P<timestamp>"
        rf"\d{{4}}-\d{{2}}-\d{{2}}T"
        rf"\d{{2}}:\d{{2}}:\d{{2}}"
        rf"(?:\.\d+)?Z)"
        rf"\s+"
        rf"(?P<level>{LEVEL_PATTERN})"
        rf"\s+"
        rf"(?P<message>.+)$",
        re.IGNORECASE,
    )

    # Example:
    #
    # ERROR database connection failed
    #
    LEVEL_TEXT = re.compile(
        rf"^(?P<level>{LEVEL_PATTERN})"
        rf"\s+"
        rf"(?P<message>.+)$",
        re.IGNORECASE,
    )

    def adapt(self, raw):
        if not isinstance(raw, str):
            raise TypeError(
                "Raw log input must be a string."
            )

        raw = raw.strip()

        if not raw:
            return CanonicalLogEvent(
                raw_message=raw,
                message=raw,
            )

        json_event = self._try_json(raw)

        if json_event is not None:
            return json_event

        kv_event = self._try_structured_key_value(raw)

        if kv_event is not None:
            return kv_event

        conventional_event = (
            self._try_conventional_text(raw)
        )

        if conventional_event is not None:
            return conventional_event

        return self._adapt_plain_text(raw)

    def _try_json(self, raw):
        if not (
            raw.startswith("{")
            and raw.endswith("}")
        ):
            return None

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None

        if not isinstance(data, dict):
            return None

        timestamp = self._first_value(
            data,
            [
                "timestamp",
                "time",
                "@timestamp",
                "datetime",
            ],
        )

        level = self._first_value(
            data,
            [
                "level",
                "severity",
                "log_level",
            ],
        )

        message = self._first_value(
            data,
            [
                "message",
                "msg",
                "log",
            ],
        )

        source = self._first_value(
            data,
            [
                "service",
                "source",
                "logger",
                "component",
            ],
        )

        if message is None:
            message = raw

        return CanonicalLogEvent(
            raw_message=raw,
            message=str(message),
            timestamp=(
                str(timestamp)
                if timestamp is not None
                else None
            ),
            level=(
                str(level).upper()
                if level is not None
                else None
            ),
            source=(
                str(source)
                if source is not None
                else None
            ),
            metadata=data,
        )

    def _try_structured_key_value(self, raw):
        values = self._extract_key_values(raw)

        if not values:
            return None

        normalized_keys = {
            key.lower()
            for key in values
        }

        structural_hits = (
            normalized_keys
            & self.STRUCTURED_KEYS
        )

        # host=x or duration=x alone does not mean the whole
        # event is a structured key=value envelope.
        if not structural_hits:
            return None

        timestamp = (
            values.get("time")
            or values.get("timestamp")
            or values.get("@timestamp")
        )

        level = (
            values.get("level")
            or values.get("severity")
            or values.get("log_level")
        )

        message = (
            values.get("msg")
            or values.get("message")
            or values.get("log")
            or raw
        )

        source = (
            values.get("service")
            or values.get("source")
            or values.get("component")
            or values.get("logger")
        )

        return CanonicalLogEvent(
            raw_message=raw,
            message=message,
            timestamp=timestamp,
            level=(
                level.upper()
                if level
                else None
            ),
            source=source,
            metadata=values,
        )

    def _try_conventional_text(self, raw):
        patterns = [
            self.DELIMITED_TEXT,
            self.SOURCE_AFTER_LEVEL,
            self.TIMESTAMP_LEVEL_TEXT,
            self.LEVEL_TEXT,
        ]

        for pattern in patterns:
            match = pattern.match(raw)

            if not match:
                continue

            groups = match.groupdict()

            message = groups.get(
                "message"
            ) or raw

            metadata = (
                self._extract_key_values(message)
            )

            return CanonicalLogEvent(
                raw_message=raw,
                message=message.strip(),
                timestamp=groups.get(
                    "timestamp"
                ),
                level=(
                    groups["level"].upper()
                    if groups.get("level")
                    else None
                ),
                source=(
                    groups.get("source").strip()
                    if groups.get("source")
                    else None
                ),
                metadata=metadata,
            )

        return None

    def _adapt_plain_text(self, raw):
        timestamp = None
        level = None

        timestamp_match = (
            self.ISO_TIMESTAMP.search(raw)
            or self.SIMPLE_TIMESTAMP.search(raw)
        )

        if timestamp_match:
            timestamp = timestamp_match.group(0)

        for token in raw.split():
            candidate = token.strip(
                "[]():,-"
            ).upper()

            if candidate in self.LEVELS:
                level = candidate
                break

        return CanonicalLogEvent(
            raw_message=raw,
            message=raw,
            timestamp=timestamp,
            level=level,
            metadata=self._extract_key_values(
                raw
            ),
        )

    def _extract_key_values(self, raw):
        values = {}

        for match in self.KEY_VALUE.finditer(raw):
            key = match.group(1)

            value = (
                match.group(2)
                or match.group(3)
                or match.group(4)
                or ""
            )

            values[key] = value

        return values

    @staticmethod
    def _first_value(data, keys):
        for key in keys:
            if key in data:
                return data[key]

        return None
