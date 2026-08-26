from dataclasses import dataclass, field

from app.envelope_variation_analyzer import (
    EnvelopeVariationAnalyzer,
)


@dataclass(frozen=True)
class AuthorizedEnvelopeRegion:
    """
    Authorization decision for one observed family region.

    ``generalize`` means the region may safely become dynamic during
    reconstruction.

    Stable regions never require generalization.

    The decision is based on structural evidence, not on a named log
    format.
    """

    role: str
    semantic_role: str | None

    values: tuple[str, ...] = field(
        default_factory=tuple
    )

    stable: bool = False
    generalize: bool = False
    reason: str = ""


@dataclass(frozen=True)
class EnvelopeAuthorization:
    """
    Authorization result for an entire structural envelope family.

    ``authorized`` means every observed region can be handled
    conservatively.

    This does not build a parser template. It only decides which
    observed regions may be generalized.
    """

    authorized: bool

    before_regions: tuple[
        AuthorizedEnvelopeRegion,
        ...
    ] = field(
        default_factory=tuple
    )

    after_regions: tuple[
        AuthorizedEnvelopeRegion,
        ...
    ] = field(
        default_factory=tuple
    )

    reason: str | None = None


class EnvelopeRegionAuthorizer:
    """
    Converts structural observations into explicit generalization
    decisions.

    Important:

        variation != authorization

    Stable regions are preserved.

    Varying regions are generalized only when the structural analyzer
    has already identified them as variable and attached a canonical
    semantic role.

    No serialization or application format names are used here.
    """

    def __init__(
        self,
        variation_analyzer=None,
    ):
        self.variation_analyzer = (
            variation_analyzer
            or EnvelopeVariationAnalyzer()
        )

    def authorize(
        self,
        family,
    ):
        if family is None:
            return EnvelopeAuthorization(
                authorized=False,
                reason="missing_family",
            )

        if not family.compatible:
            return EnvelopeAuthorization(
                authorized=False,
                reason="incompatible_family",
            )

        before = self._authorize_regions(
            family.before_regions
        )

        if before is None:
            return EnvelopeAuthorization(
                authorized=False,
                reason="unauthorized_before_region",
            )

        after = self._authorize_regions(
            family.after_regions
        )

        if after is None:
            return EnvelopeAuthorization(
                authorized=False,
                reason="unauthorized_after_region",
            )

        return EnvelopeAuthorization(
            authorized=True,
            before_regions=tuple(before),
            after_regions=tuple(after),
            reason="authorized_structure",
        )

    def _authorize_regions(
        self,
        regions,
    ):
        decisions = []

        for region in regions:

            if region.stable:
                decisions.append(
                    AuthorizedEnvelopeRegion(
                        role=region.role,
                        semantic_role=region.semantic_role,
                        values=region.values,
                        stable=True,
                        generalize=False,
                        reason="stable_region",
                    )
                )
                continue

            # -------------------------------------------------
            # Existing strong structural evidence.
            #
            # A region already identified locally as a canonical
            # variable remains directly authorizable.
            # -------------------------------------------------

            if (
                region.role == "variable"
                and region.semantic_role is not None
            ):
                decisions.append(
                    AuthorizedEnvelopeRegion(
                        role=region.role,
                        semantic_role=region.semantic_role,
                        values=region.values,
                        stable=False,
                        generalize=True,
                        reason=(
                            "structurally_identified_variable"
                        ),
                    )
                )
                continue

            # -------------------------------------------------
            # Generic evidence from the observed values.
            #
            # The field name and serialization are irrelevant.
            #
            # Examples:
            #
            #     db-101, db-205, db-991
            #
            # may provide a stable variable-bearing skeleton,
            # while:
            #
            #     failed, restored, delayed
            #
            # does not.
            #
            # Variation alone is never enough.
            # -------------------------------------------------

            evidence = self.variation_analyzer.analyze(
                region.values
            )

            if not evidence.runtime_like:
                return None

            decisions.append(
                AuthorizedEnvelopeRegion(
                    role=region.role,
                    semantic_role=region.semantic_role,
                    values=region.values,
                    stable=False,
                    generalize=True,
                    reason=(
                        "runtime_like_value_structure"
                    ),
                )
            )

        return decisions
