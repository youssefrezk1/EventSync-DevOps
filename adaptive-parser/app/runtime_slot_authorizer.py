from app.cross_structure_evidence import (
    CrossStructureRuntimeEvidence,
)
from app.runtime_slot import RuntimeSlot
from app.runtime_slot_analyzer import RuntimeSlotAnalyzer


class RuntimeSlotAuthorizer:
    """
    Combines independent runtime-slot evidence sources.

    Evidence can come from:

      1. the candidate messages themselves;
      2. a broader structural population supplied by the caller.

    Plain lexical variation alone is never sufficient.
    """

    def __init__(
        self,
        analyzer=None,
        cross_structure=None,
    ):
        self.analyzer = (
            analyzer or RuntimeSlotAnalyzer()
        )

        self.cross_structure = (
            cross_structure
            or CrossStructureRuntimeEvidence()
        )

    def analyze(
        self,
        normalized_messages,
        evidence_messages=None,
    ):
        local_slots = self.analyzer.analyze(
            normalized_messages
        )

        evidence_population = (
            evidence_messages
            if evidence_messages is not None
            else normalized_messages
        )

        cross_positions = (
            self.cross_structure.discover(
                evidence_population
            )
        )

        results = []

        seen_positions = set()

        for slot in local_slots:
            seen_positions.add(
                slot.position
            )

            if slot.authorized:
                results.append(slot)
                continue

            if slot.position in cross_positions:
                results.append(
                    RuntimeSlot(
                        position=slot.position,
                        evidence=(
                            "cross_structure_recurrence"
                        ),
                        confidence="medium",
                        authorized=True,
                    )
                )
                continue

            results.append(slot)

        # A broader evidence population may identify a position
        # that does not appear as variable in the local analyzer.
        # Only expose positions that are actually present in the
        # candidate token range.
        if normalized_messages:
            minimum_length = min(
                len(message.split())
                for message in normalized_messages
            )

            for position in sorted(
                cross_positions
            ):
                if position in seen_positions:
                    continue

                if position >= minimum_length:
                    continue

                results.append(
                    RuntimeSlot(
                        position=position,
                        evidence=(
                            "cross_structure_recurrence"
                        ),
                        confidence="medium",
                        authorized=True,
                    )
                )

        return sorted(
            results,
            key=lambda slot: slot.position,
        )

    def authorized_positions(
        self,
        normalized_messages,
        evidence_messages=None,
    ):
        return {
            slot.position
            for slot in self.analyze(
                normalized_messages,
                evidence_messages=evidence_messages,
            )
            if slot.authorized
        }
