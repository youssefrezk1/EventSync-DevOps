from abc import ABC, abstractmethod

from app.regex_generator import TemplateRegexGenerator


class MatcherDefinitionBuilder(ABC):
    """
    Converts a parser representation into an executable matcher
    definition.

    The adaptive engine depends on this abstraction rather than on a
    specific matching technology.

    Implementations may construct regex matchers, structured-field
    matchers, token matchers, schema matchers, or other deterministic
    matching capabilities.
    """

    @abstractmethod
    def build(
        self,
        template,
    ):
        """
        Return a MatcherRegistry-compatible definition:

            {
                "type": "...",
                "config": {...},
            }
        """

        raise NotImplementedError


class RegexMatcherDefinitionBuilder(
    MatcherDefinitionBuilder
):
    """
    Current deterministic implementation.

    Converts the existing <*> parser-template representation into a
    regex matcher definition.

    Regex is an implementation detail of this builder and is not
    exposed as an architectural requirement to the adaptive engine.
    """

    def __init__(
        self,
        regex_generator=None,
    ):
        self.regex_generator = (
            regex_generator
            or TemplateRegexGenerator()
        )

    def build(
        self,
        template,
    ):
        if not template:
            raise ValueError(
                "Template is required."
            )

        pattern = (
            self.regex_generator.generate(
                template
            )
        )

        return {
            "type": "regex",
            "config": {
                "pattern": pattern,
            },
        }
