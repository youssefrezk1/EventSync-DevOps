from dataclasses import dataclass, field


@dataclass(frozen=True)
class StructuralRegion:
    """
    One locally observed region of a raw input.

    ``role`` describes what the region means structurally rather than
    naming a log format.

    Examples of roles may include:

        literal
        variable
        semantic

    ``value`` preserves the locally observed content.

    ``semantic_role`` may describe a known canonical meaning such as
    timestamp, level, source, or message without coupling the
    structure to any particular serialization format.
    """

    role: str
    value: str
    semantic_role: str | None = None


@dataclass(frozen=True)
class StructuralEnvelope:
    """
    Format-independent structural description of one raw input.

    The envelope describes how a canonical message relates to the raw
    representation without assigning names such as JSON, key=value,
    Java, Python, or syslog.

    Reconstruction capability is represented explicitly rather than
    inferred from a format name.
    """

    regions_before_message: tuple = field(
        default_factory=tuple
    )

    regions_after_message: tuple = field(
        default_factory=tuple
    )

    message_found: bool = False

    reconstructable: bool = False

    def all_regions(self):
        return (
            self.regions_before_message
            + self.regions_after_message
        )
