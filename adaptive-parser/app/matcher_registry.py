from app.regex_matcher import RegexParserMatcher


class MatcherRegistry:
    """
    Resolves matcher implementations by capability identifier.

    ParserRegistry depends on this resolver rather than on any
    specific matching implementation.
    """

    def __init__(
        self,
        matchers=None,
    ):
        if matchers is None:
            matchers = {
                "regex": RegexParserMatcher(),
            }

        self.matchers = dict(
            matchers
        )

    def register(
        self,
        name,
        matcher,
    ):
        if not name:
            raise ValueError(
                "Matcher name is required."
            )

        if matcher is None:
            raise ValueError(
                "Matcher is required."
            )

        self.matchers[name] = matcher

    def resolve(
        self,
        name,
    ):
        matcher = self.matchers.get(
            name
        )

        if matcher is None:
            raise ValueError(
                f"Unknown matcher type: {name}"
            )

        return matcher

    def match(
        self,
        matcher_definition,
        message,
    ):
        if not isinstance(
            matcher_definition,
            dict,
        ):
            raise TypeError(
                "Matcher definition must be a dict."
            )

        matcher_type = (
            matcher_definition.get(
                "type"
            )
        )

        config = (
            matcher_definition.get(
                "config",
                {},
            )
        )

        matcher = self.resolve(
            matcher_type
        )

        return matcher.match(
            message,
            config,
        )
