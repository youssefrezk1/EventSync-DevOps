from collections import defaultdict


class EventSkeletonBuilder:
    """
    Creates clustering-only structural representations.

    Variable/entity slots are inferred from repeated structural
    evidence inside the current coarse partition.

    A position is considered an entity candidate when multiple
    different token values occur there while sharing the same
    continuation/suffix structure.

    No application vocabulary is hard-coded.
    """

    def build_partition(self, normalized_messages):
        if not normalized_messages:
            return []

        tokenized = [
            message.split()
            for message in normalized_messages
        ]

        entity_positions = (
            self._discover_entity_positions(
                tokenized
            )
        )

        skeletons = []

        for tokens in tokenized:
            output = list(tokens)

            for position in entity_positions:
                if position < len(output):
                    output[position] = "<ENTITY>"

            skeletons.append(
                " ".join(output)
            )

        return skeletons

    def _discover_entity_positions(
        self,
        tokenized,
    ):
        if len(tokenized) < 2:
            return set()

        maximum_length = max(
            len(tokens)
            for tokens in tokenized
        )

        entity_positions = set()

        for position in range(maximum_length):
            # suffix -> values observed immediately before it
            suffix_values = defaultdict(set)

            for tokens in tokenized:
                if position >= len(tokens):
                    continue

                value = tokens[position]

                if self._is_protected(value):
                    continue

                suffix = tuple(
                    tokens[position + 1:]
                )

                # An empty suffix gives us almost no structural
                # evidence about the role of this token.
                if not suffix:
                    continue

                suffix_values[suffix].add(
                    value
                )

            # If at least one identical continuation occurs after
            # multiple different values, the position behaves like
            # a variable/entity slot.
            has_structural_evidence = any(
                len(values) >= 2
                for values
                in suffix_values.values()
            )

            if has_structural_evidence:
                entity_positions.add(
                    position
                )

        return entity_positions

    @staticmethod
    def _is_protected(token):
        # Existing runtime placeholders should not be rediscovered.
        if (
            token.startswith("<")
            and token.endswith(">")
        ):
            return True

        # Tokens such as depth=<NUM> or latency=<NUM>ms carry
        # useful structural information.
        if "=" in token:
            return True

        return False
