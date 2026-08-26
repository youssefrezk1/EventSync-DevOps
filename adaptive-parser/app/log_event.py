from dataclasses import dataclass, field


@dataclass
class CanonicalLogEvent:
    raw_message: str
    message: str
    timestamp: str | None = None
    level: str | None = None
    source: str | None = None
    metadata: dict = field(default_factory=dict)
