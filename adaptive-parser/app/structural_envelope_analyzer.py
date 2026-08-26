from app.log_adapter import LogAdapter
from app.structural_envelope import (
    StructuralEnvelope,
    StructuralRegion,
)


class StructuralEnvelopeAnalyzer:
    """
    Derives a format-independent structural envelope from the
    relationship between a raw log and its canonical event.

    This analyzer does not classify inputs as JSON, key=value,
    Java-style, Python-style, syslog, or any other named format.

    It only reasons about:

      - where the canonical message appears;
      - which surrounding values correspond to known canonical roles;
      - which surrounding content is literal;
      - whether deterministic textual reconstruction is currently
        possible.
    """

    def __init__(
        self,
        adapter=None,
    ):
        self.adapter = (
            adapter
            or LogAdapter()
        )

    def analyze(
        self,
        raw_message,
    ):
        event = self.adapter.adapt(
            raw_message
        )

        raw = event.raw_message
        message = event.message

        if not message:
            return StructuralEnvelope(
                message_found=False,
                reconstructable=False,
            )

        position = raw.find(
            message
        )

        if position < 0:
            return StructuralEnvelope(
                message_found=False,
                reconstructable=False,
            )

        prefix = raw[:position]

        suffix = raw[
            position + len(message):
        ]

        before = self._analyze_region(
            prefix,
            event,
        )

        after = self._analyze_region(
            suffix,
            event,
        )

        return StructuralEnvelope(
            regions_before_message=tuple(
                before
            ),
            regions_after_message=tuple(
                after
            ),
            message_found=True,
            reconstructable=True,
        )

    def _analyze_region(
        self,
        text,
        event,
    ):
        if not text:
            return []

        semantic_values = []

        if event.timestamp:
            semantic_values.append(
                (
                    str(event.timestamp),
                    "timestamp",
                    "variable",
                )
            )

        if event.level:
            semantic_values.append(
                (
                    str(event.level),
                    "level",
                    "semantic",
                )
            )

        if event.source:
            semantic_values.append(
                (
                    str(event.source),
                    "source",
                    "semantic",
                )
            )

        # -----------------------------------------------------
        # Observe arbitrary canonical metadata structurally.
        #
        # This does NOT authorize metadata variation.
        #
        # The purpose is only to avoid treating known metadata
        # values as anonymous literal syntax around the canonical
        # message.
        #
        # Examples may include hosts, queue names, request IDs,
        # statuses, tenant identifiers, or fields we have never
        # seen before.
        #
        # No application vocabulary or serialization format is
        # required here.
        # -----------------------------------------------------

        canonical_values = {
            (
                str(event.timestamp)
                if event.timestamp is not None
                else None
            ),
            (
                str(event.level)
                if event.level is not None
                else None
            ),
            (
                str(event.source)
                if event.source is not None
                else None
            ),
            (
                str(event.message)
                if event.message is not None
                else None
            ),
        }

        for key, value in (
            event.metadata or {}
        ).items():

            if value is None:
                continue

            # Nested structures require a separate structural
            # representation. Do not stringify them into accidental
            # matching rules.
            if isinstance(
                value,
                (
                    dict,
                    list,
                    tuple,
                    set,
                ),
            ):
                continue

            value = str(value)

            if not value:
                continue

            # Canonical roles already have stronger evidence and
            # should win when the same observed value appears here.
            if value in canonical_values:
                continue

            semantic_values.append(
                (
                    value,
                    f"metadata:{key}",
                    "semantic",
                )
            )

        # Prefer longer values first so overlapping canonical values
        # do not fragment one another.
        semantic_values.sort(
            key=lambda item: len(item[0]),
            reverse=True,
        )

        regions = []

        cursor = 0

        while cursor < len(text):
            match = self._next_semantic_match(
                text,
                cursor,
                semantic_values,
            )

            if match is None:
                regions.append(
                    StructuralRegion(
                        role="literal",
                        value=text[cursor:],
                    )
                )
                break

            start, end, value, semantic_role, role = match

            if start > cursor:
                regions.append(
                    StructuralRegion(
                        role="literal",
                        value=text[
                            cursor:start
                        ],
                    )
                )

            regions.append(
                StructuralRegion(
                    role=role,
                    value=value,
                    semantic_role=semantic_role,
                )
            )

            cursor = end

        return self._merge_literals(
            regions
        )

    def _next_semantic_match(
        self,
        text,
        cursor,
        semantic_values,
    ):
        best = None

        for (
            value,
            semantic_role,
            role,
        ) in semantic_values:
            position = text.find(
                value,
                cursor,
            )

            if position < 0:
                continue

            candidate = (
                position,
                position + len(value),
                value,
                semantic_role,
                role,
            )

            if (
                best is None
                or candidate[0] < best[0]
                or (
                    candidate[0] == best[0]
                    and len(candidate[2])
                    > len(best[2])
                )
            ):
                best = candidate

        return best

    def _merge_literals(
        self,
        regions,
    ):
        merged = []

        for region in regions:
            if (
                merged
                and region.role == "literal"
                and merged[-1].role == "literal"
                and merged[-1].semantic_role is None
            ):
                previous = merged.pop()

                merged.append(
                    StructuralRegion(
                        role="literal",
                        value=(
                            previous.value
                            + region.value
                        ),
                    )
                )
            else:
                merged.append(
                    region
                )

        return merged
