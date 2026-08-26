class RuntimeSlotDiscoverer:
    """
    Discovers likely runtime-value positions from a collection of
    structurally related normalized messages.

    The implementation is deliberately vocabulary-independent.

    It does not need to know that a token represents a username,
    session ID, queue name, hostname, translated word, or any other
    application-specific concept.

    A position is considered variable when:

      1. every message contains that position;
      2. more than one distinct value occurs there;
      3. the surrounding structure provides stable context.

    The component only discovers candidate runtime positions.
    It never modifies the original raw messages.
    """

    def discover(self, normalized_messages):
        if not normalized_messages:
            return set()

        tokenized = [
            message.split()
            for message in normalized_messages
        ]

        if len(tokenized) < 2:
            return set()

        minimum_length = min(
            len(tokens)
            for tokens in tokenized
        )

        variable_positions = set()

        for position in range(minimum_length):
            values = {
                tokens[position]
                for tokens in tokenized
            }

            if len(values) <= 1:
                continue

            if self._has_stable_context(
                tokenized,
                position,
            ):
                variable_positions.add(
                    position
                )

        return variable_positions

    def mask(
        self,
        normalized_messages,
        positions=None,
    ):
        if not normalized_messages:
            return []

        if positions is None:
            positions = self.discover(
                normalized_messages
            )

        masked_messages = []

        for message in normalized_messages:
            tokens = message.split()

            masked_tokens = [
                (
                    "<VAR>"
                    if position in positions
                    else token
                )
                for position, token in enumerate(tokens)
            ]

            masked_messages.append(
                " ".join(masked_tokens)
            )

        return masked_messages

    def _has_stable_context(
        self,
        tokenized,
        position,
    ):
        """
        Require at least one neighboring position to remain stable.

        This prevents a completely heterogeneous collection of
        messages from having every differing token classified as a
        runtime value.
        """

        left_stable = False
        right_stable = False

        if position > 0:
            left_values = {
                tokens[position - 1]
                for tokens in tokenized
                if position - 1 < len(tokens)
            }

            left_stable = (
                len(left_values) == 1
            )

        if all(
            position + 1 < len(tokens)
            for tokens in tokenized
        ):
            right_values = {
                tokens[position + 1]
                for tokens in tokenized
            }

            right_stable = (
                len(right_values) == 1
            )

        return (
            left_stable
            or right_stable
        )
