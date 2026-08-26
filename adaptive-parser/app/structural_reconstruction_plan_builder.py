from app.envelope_region_authorizer import (
    EnvelopeRegionAuthorizer,
)
from app.structural_envelope_family_analyzer import (
    StructuralEnvelopeFamilyAnalyzer,
)
from app.structural_reconstruction_plan import (
    ReconstructionSegment,
    StructuralReconstructionPlan,
)


class StructuralReconstructionPlanBuilder:
    """
    Converts authorized structural evidence into a deterministic
    reconstruction plan.

    This builder does not know about JSON, key=value, syslog, Java,
    Python, or any other named log format.
    """

    def __init__(
        self,
        family_analyzer=None,
        authorizer=None,
    ):
        self.family_analyzer = (
            family_analyzer
            or StructuralEnvelopeFamilyAnalyzer()
        )

        self.authorizer = (
            authorizer
            or EnvelopeRegionAuthorizer()
        )

    def build(
        self,
        raw_messages,
    ):
        family = (
            self.family_analyzer.analyze(
                raw_messages
            )
        )

        authorization = (
            self.authorizer.authorize(
                family
            )
        )

        if not authorization.authorized:
            return StructuralReconstructionPlan(
                authorized=False,
                reason=authorization.reason,
            )

        segments = []

        segments.extend(
            self._segments_from_regions(
                authorization.before_regions
            )
        )

        segments.append(
            ReconstructionSegment(
                kind="message"
            )
        )

        segments.extend(
            self._segments_from_regions(
                authorization.after_regions
            )
        )

        return StructuralReconstructionPlan(
            segments=tuple(segments),
            authorized=True,
            reason="authorized_structure",
        )

    def _segments_from_regions(
        self,
        regions,
    ):
        segments = []

        for region in regions:

            if region.stable:
                segments.append(
                    ReconstructionSegment(
                        kind="literal",
                        value=region.values[0],
                    )
                )
                continue

            if region.generalize:
                segments.append(
                    ReconstructionSegment(
                        kind="wildcard"
                    )
                )
                continue

            return []

        return segments
