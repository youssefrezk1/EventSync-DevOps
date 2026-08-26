import re

from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeValueEvidence:
    """
    Evidence derived only from observed value structure.

    This object does not authorize parser generalization.

    It reports whether observed values share a stable lexical
    structure containing runtime-bearing variation.
    """

    runtime_like: bool
    normalized_values: tuple[str, ...]
    reason: str


class RuntimeValueEvidenceAnalyzer:
    """
    Generic runtime-value evidence analyzer.

    This component has no knowledge of:

      - parser positions;
      - envelope regions;
      - metadata field names;
      - serialization formats;
      - applications;
      - providers.

    It only asks whether observed values contain recognizable runtime
    structure and whether several varying values reduce to the same
    variable-bearing lexical skeleton.
    """

    TOKEN_PATTERNS = (
        (
            re.compile(
                r"\b"
                r"(?:\d{1,3}\.){3}\d{1,3}"
                r"\b"
            ),
            "<IP>",
        ),
        (
            re.compile(
                r"\b"
                r"[0-9a-fA-F]{8}-"
                r"[0-9a-fA-F]{4}-"
                r"[0-9a-fA-F]{4}-"
                r"[0-9a-fA-F]{4}-"
                r"[0-9a-fA-F]{12}"
                r"\b"
            ),
            "<UUID>",
        ),
        (
            re.compile(
                r"\d+"
            ),
            "<NUM>",
        ),
    )

    VARIABLE_MARKERS = (
        "<NUM>",
        "<IP>",
        "<UUID>",
        "<TIMESTAMP>",
        "<EMAIL>",
        "<SECRET>",
    )

    def contains_normalized_runtime_marker(
        self,
        value,
    ):
        """
        Return whether the supplied value already contains a canonical
        runtime marker produced by deterministic normalization.

        This is distinct from recognizing raw runtime-shaped values.
        """

        value = str(value)

        return any(
            marker in value
            for marker in self.VARIABLE_MARKERS
        )

    def contains_runtime_evidence(
        self,
        value,
    ):
        normalized = self.normalize(
            value
        )

        return any(
            marker in normalized
            for marker in self.VARIABLE_MARKERS
        )

    def analyze(
        self,
        values,
    ):
        values = tuple(
            str(value)
            for value in values
        )

        if len(values) < 2:
            return RuntimeValueEvidence(
                runtime_like=False,
                normalized_values=values,
                reason="insufficient_observations",
            )

        if len(set(values)) <= 1:
            return RuntimeValueEvidence(
                runtime_like=False,
                normalized_values=values,
                reason="no_variation",
            )

        # -------------------------------------------------
        # Strong pre-normalized evidence.
        #
        # Upstream deterministic normalization may already have
        # identified runtime-bearing structure:
        #
        #     abc<NUM>
        #     def<NUM>
        #     ghi<NUM>
        #
        # These values need not share identical lexical prefixes.
        # The embedded canonical markers themselves are already
        # strong runtime evidence.
        # -------------------------------------------------

        if all(
            self.contains_normalized_runtime_marker(
                value
            )
            for value in values
        ):
            return RuntimeValueEvidence(
                runtime_like=True,
                normalized_values=values,
                reason="embedded_normalized_placeholder",
            )

        normalized = tuple(
            self.normalize(value)
            for value in values
        )

        if len(set(normalized)) != 1:
            return RuntimeValueEvidence(
                runtime_like=False,
                normalized_values=normalized,
                reason="inconsistent_lexical_structure",
            )

        skeleton = normalized[0]

        if not any(
            marker in skeleton
            for marker in self.VARIABLE_MARKERS
        ):
            return RuntimeValueEvidence(
                runtime_like=False,
                normalized_values=normalized,
                reason="no_runtime_slot_evidence",
            )

        return RuntimeValueEvidence(
            runtime_like=True,
            normalized_values=normalized,
            reason="stable_variable_bearing_structure",
        )

    def normalize(
        self,
        value,
    ):
        normalized = str(
            value
        )

        for pattern, replacement in (
            self.TOKEN_PATTERNS
        ):
            normalized = pattern.sub(
                replacement,
                normalized,
            )

        return normalized
