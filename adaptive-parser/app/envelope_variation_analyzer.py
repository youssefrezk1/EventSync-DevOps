from dataclasses import dataclass

from app.runtime_value_evidence import (
    RuntimeValueEvidenceAnalyzer,
)


@dataclass(frozen=True)
class EnvelopeVariationEvidence:
    """
    Evidence about one varying structural-envelope region.

    This component does not know field names, log formats, providers,
    applications, or serialization technologies.

    ``runtime_like`` means the observed values contain a stable
    lexical structure with changing runtime-shaped slots.

    This is evidence for authorization, not a parser template.
    """

    runtime_like: bool
    normalized_values: tuple[str, ...]
    reason: str


class EnvelopeVariationAnalyzer:
    """
    Envelope-facing adapter for generic runtime-value evidence.

    Runtime-value recognition is owned by
    RuntimeValueEvidenceAnalyzer.

    This class preserves the existing envelope-specific public API so
    envelope authorization remains independent from the underlying
    evidence implementation.
    """

    def __init__(
        self,
        value_analyzer=None,
    ):
        self.value_analyzer = (
            value_analyzer
            or RuntimeValueEvidenceAnalyzer()
        )

    def analyze(
        self,
        values,
    ):
        evidence = self.value_analyzer.analyze(
            values
        )

        return EnvelopeVariationEvidence(
            runtime_like=evidence.runtime_like,
            normalized_values=evidence.normalized_values,
            reason=evidence.reason,
        )

    def _normalize(
        self,
        value,
    ):
        """
        Backward-compatible normalization hook.

        Runtime normalization itself is owned by the shared generic
        value analyzer.
        """

        return self.value_analyzer.normalize(
            value
        )
