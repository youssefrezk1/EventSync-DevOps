class ClusterSafetyValidator:
    """
    Determines whether a candidate group of messages is structurally
    safe to use for learning one parser.

    This component is deliberately application-independent.

    It does not know that words such as "failed", "completed",
    "restored", or "started" have particular meanings.

    Instead, it examines token variation structurally.

    Runtime positions supplied by an upstream runtime-slot detector
    are allowed to vary. Variation at other aligned positions is
    treated conservatively as semantic/static variation.
    """

    def validate(
        self,
        messages,
        runtime_positions=None,
    ):
        if not messages:
            return {
                "safe": False,
                "reason": "empty_cluster",
                "variable_positions": [],
                "unsafe_positions": [],
            }

        if len(messages) == 1:
            return {
                "safe": True,
                "reason": "single_message",
                "variable_positions": [],
                "unsafe_positions": [],
            }

        runtime_positions = set(
            runtime_positions or []
        )

        tokenized = [
            message.split()
            for message in messages
        ]

        lengths = {
            len(tokens)
            for tokens in tokenized
        }

        if len(lengths) != 1:
            return {
                "safe": False,
                "reason": "different_token_lengths",
                "variable_positions": [],
                "unsafe_positions": [],
            }

        token_count = len(tokenized[0])

        variable_positions = []
        unsafe_positions = []

        for position in range(token_count):
            values = {
                tokens[position]
                for tokens in tokenized
            }

            if len(values) <= 1:
                continue

            variable_positions.append(
                position
            )

            if position not in runtime_positions:
                unsafe_positions.append(
                    position
                )

        safe = not unsafe_positions

        return {
            "safe": safe,
            "reason": (
                "compatible_structure"
                if safe
                else "unapproved_token_variation"
            ),
            "variable_positions": (
                variable_positions
            ),
            "unsafe_positions": (
                unsafe_positions
            ),
        }
