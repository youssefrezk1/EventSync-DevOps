from app.matcher_registry import MatcherRegistry


class ParserValidator:
    """
    Validates a candidate parser through its matching capability.

    Validation policy is independent of the matching implementation.

    A parser may therefore be backed by regexes, structured fields,
    token models, schemas, or another deterministic matcher supported
    by MatcherRegistry.

    Legacy callers may continue supplying ``regex``. It is translated
    into the generic matcher representation before validation.
    """

    def __init__(
        self,
        minimum_coverage=0.9,
        maximum_negative_match_rate=0.0,
        matcher_registry=None,
    ):
        self.minimum_coverage = minimum_coverage
        self.maximum_negative_match_rate = (
            maximum_negative_match_rate
        )

        self.matcher_registry = (
            matcher_registry
            or MatcherRegistry()
        )

    def validate(
        self,
        positive_messages,
        negative_messages=None,
        matcher=None,
        regex=None,
    ):
        if not positive_messages:
            raise ValueError(
                "At least one positive message is required."
            )

        matcher_definition = (
            self._resolve_matcher_definition(
                matcher=matcher,
                regex=regex,
            )
        )

        negative_messages = (
            negative_messages
            or []
        )

        positive_matches = []
        parameter_counts = []

        for message in positive_messages:
            result = self.matcher_registry.match(
                matcher_definition,
                message,
            )

            matched = bool(
                result["matched"]
            )

            positive_matches.append(
                matched
            )

            if matched:
                parameter_counts.append(
                    len(
                        result.get(
                            "parameters",
                            [],
                        )
                    )
                )

        coverage = (
            sum(positive_matches)
            / len(positive_messages)
        )

        negative_matches = []

        for message in negative_messages:
            result = self.matcher_registry.match(
                matcher_definition,
                message,
            )

            negative_matches.append(
                bool(
                    result["matched"]
                )
            )

        if negative_messages:
            negative_match_rate = (
                sum(negative_matches)
                / len(negative_messages)
            )
        else:
            negative_match_rate = 0.0

        parameter_count_consistent = (
            len(set(parameter_counts)) <= 1
            if parameter_counts
            else False
        )

        passed = (
            coverage
            >= self.minimum_coverage
            and negative_match_rate
            <= self.maximum_negative_match_rate
            and parameter_count_consistent
        )

        return {
            "passed": passed,
            "coverage": coverage,
            "negative_match_rate": (
                negative_match_rate
            ),
            "parameter_count_consistent": (
                parameter_count_consistent
            ),
            "parameter_count": (
                parameter_counts[0]
                if parameter_counts
                else 0
            ),
        }

    def _resolve_matcher_definition(
        self,
        matcher,
        regex,
    ):
        if (
            matcher is not None
            and regex is not None
        ):
            raise ValueError(
                "Provide matcher or regex, not both."
            )

        if matcher is not None:
            if not isinstance(
                matcher,
                dict,
            ):
                raise TypeError(
                    "Matcher definition must be a dict."
                )

            return matcher

        if regex is not None:
            return {
                "type": "regex",
                "config": {
                    "pattern": regex,
                },
            }

        raise ValueError(
            "Matcher definition is required."
        )
