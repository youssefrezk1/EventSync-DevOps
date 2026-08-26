import re

from app.parser_matcher import ParserMatcher


class RegexParserMatcher(ParserMatcher):
    """
    Regex-backed parser matcher.

    This preserves the existing parser behavior behind the new
    generic matching interface.
    """

    def match(
        self,
        message,
        config,
    ):
        if not isinstance(
            config,
            dict,
        ):
            raise TypeError(
                "Regex matcher config must be a dict."
            )

        pattern = config.get(
            "pattern"
        )

        if not pattern:
            raise ValueError(
                "Regex matcher requires a pattern."
            )

        result = re.fullmatch(
            pattern,
            message,
        )

        if result is None:
            return {
                "matched": False,
                "parameters": [],
            }

        return {
            "matched": True,
            "parameters": list(
                result.groups()
            ),
        }
