from collections import defaultdict


class CrossStructureRuntimeEvidence:
    """
    Finds lexical token positions that behave like recurring entity
    dimensions across multiple structural continuations.

    Example:

        queue orders depth=<NUM>
        queue payments depth=<NUM>
        queue notifications depth=<NUM>

        queue orders processing delay=<NUM>ms
        queue payments processing delay=<NUM>ms
        queue notifications processing delay=<NUM>ms

    Position 1 is strong runtime/entity evidence because the same value
    set appears across multiple different suffix structures.

    No vocabulary knowledge is required.
    """

    def discover(
        self,
        normalized_messages,
    ):
        if not normalized_messages:
            return set()

        tokenized = [
            message.split()
            for message in normalized_messages
        ]

        if len(tokenized) < 2:
            return set()

        maximum_length = max(
            len(tokens)
            for tokens in tokenized
        )

        authorized_positions = set()

        for position in range(maximum_length):
            suffix_to_values = defaultdict(set)

            for tokens in tokenized:
                if position >= len(tokens):
                    continue

                value = tokens[position]

                if self._is_protected(value):
                    continue

                suffix = tuple(
                    tokens[position + 1:]
                )

                if not suffix:
                    continue

                suffix_to_values[suffix].add(
                    value
                )

            # Keep only structures where multiple different lexical
            # values occupied this position.
            meaningful_structures = {
                suffix: values
                for suffix, values
                in suffix_to_values.items()
                if len(values) >= 2
            }

            if len(
                meaningful_structures
            ) < 2:
                continue

            value_sets = list(
                meaningful_structures.values()
            )

            # Strong evidence exists when multiple different suffix
            # structures share at least two recurring values.
            recurring_values = set.intersection(
                *value_sets
            )

            if len(recurring_values) >= 2:
                authorized_positions.add(
                    position
                )

        return authorized_positions

    @staticmethod
    def _is_protected(token):
        if (
            token.startswith("<")
            and token.endswith(">")
        ):
            return True

        if "=" in token:
            return True

        return False
