from app.structural_envelope_analyzer import (
    StructuralEnvelopeAnalyzer,
)
from app.structural_envelope_family import (
    StructuralEnvelopeFamily,
    StructuralFamilyRegion,
)


class StructuralEnvelopeFamilyAnalyzer:
    """
    Compares several structurally analyzed raw inputs.

    The analyzer is format-independent.

    It does not know about JSON, key=value, Java, Python, syslog,
    containers, cloud providers, or application-specific formats.

    Compatibility is based only on aligned structural evidence.

    Important:

        observed variation != authorized generalization

    This component reports variation but does not decide whether a
    varying semantic or lexical region may safely become a wildcard.
    """

    def __init__(
        self,
        analyzer=None,
    ):
        self.analyzer = (
            analyzer
            or StructuralEnvelopeAnalyzer()
        )

    def analyze(
        self,
        raw_messages,
    ):
        raw_messages = list(
            raw_messages
        )

        if not raw_messages:
            return StructuralEnvelopeFamily(
                compatible=False,
                reason="empty_family",
            )

        envelopes = [
            self.analyzer.analyze(
                message
            )
            for message in raw_messages
        ]

        if not all(
            envelope.message_found
            for envelope in envelopes
        ):
            return StructuralEnvelopeFamily(
                compatible=False,
                reason="message_not_found",
            )

        if not all(
            envelope.reconstructable
            for envelope in envelopes
        ):
            return StructuralEnvelopeFamily(
                compatible=False,
                reason="observation_not_reconstructable",
            )

        before = self._align_regions(
            [
                envelope.regions_before_message
                for envelope in envelopes
            ]
        )

        if before is None:
            return StructuralEnvelopeFamily(
                compatible=False,
                reason="incompatible_before_structure",
            )

        after = self._align_regions(
            [
                envelope.regions_after_message
                for envelope in envelopes
            ]
        )

        if after is None:
            return StructuralEnvelopeFamily(
                compatible=False,
                reason="incompatible_after_structure",
            )

        return StructuralEnvelopeFamily(
            compatible=True,
            before_regions=tuple(
                before
            ),
            after_regions=tuple(
                after
            ),
            reason="compatible_structure",
        )

    def _align_regions(
        self,
        region_groups,
    ):
        lengths = {
            len(regions)
            for regions in region_groups
        }

        if len(lengths) != 1:
            return None

        if not region_groups:
            return []

        result = []

        for aligned in zip(
            *region_groups
        ):
            roles = {
                region.role
                for region in aligned
            }

            semantic_roles = {
                region.semantic_role
                for region in aligned
            }

            if len(roles) != 1:
                return None

            if len(semantic_roles) != 1:
                return None

            role = next(
                iter(roles)
            )

            semantic_role = next(
                iter(semantic_roles)
            )

            values = tuple(
                region.value
                for region in aligned
            )

            stable = (
                len(set(values)) == 1
            )

            # Literal structure may not silently drift.
            #
            # A varying literal means the family is not yet
            # structurally justified as one reconstruction family.
            if (
                role == "literal"
                and not stable
            ):
                return None

            result.append(
                StructuralFamilyRegion(
                    role=role,
                    semantic_role=semantic_role,
                    values=values,
                    stable=stable,
                )
            )

        return result
