from abc import ABC, abstractmethod


class ParserMatcher(ABC):
    """
    Generic parser-matching strategy.

    A matcher receives one raw input and a matcher configuration.

    The surrounding registry does not need to know how matching is
    implemented.

    Implementations may use regexes, structured fields, token models,
    schemas, or other deterministic strategies.
    """

    @abstractmethod
    def match(
        self,
        message,
        config,
    ):
        """
        Return a standard match result:

            {
                "matched": bool,
                "parameters": list,
            }
        """

        raise NotImplementedError
