import json
from pathlib import Path

from app.matcher_registry import MatcherRegistry


class ParserRegistry:
    def __init__(
        self,
        registry_path,
        matcher_registry=None,
    ):
        self.registry_path = Path(
            registry_path
        )

        self.matcher_registry = (
            matcher_registry
            or MatcherRegistry()
        )

        self.parsers = []
        self.load()

    def load(self):
        with self.registry_path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        self.parsers = data.get("parsers", [])

    def save(self):
        data = {
            "parsers": self.parsers
        }

        with self.registry_path.open("w", encoding="utf-8") as file:
            json.dump(
                data,
                file,
                indent=2,
            )

    def match(self, message):
        for parser in self.parsers:
            matcher_definition = (
                self._matcher_definition(
                    parser
                )
            )

            if matcher_definition is None:
                continue

            result = (
                self.matcher_registry.match(
                    matcher_definition,
                    message,
                )
            )

            if result["matched"]:
                return {
                    "matched": True,
                    "parser_id": parser["id"],
                    "template": parser["template"],
                    "parameters": result[
                        "parameters"
                    ],
                }

        return {
            "matched": False,
            "parser_id": None,
            "template": None,
            "parameters": [],
        }

    def _matcher_definition(
        self,
        parser,
    ):
        """
        Resolve the generic matcher definition for a stored parser.

        New parser records may provide an explicit matcher definition.

        Legacy parser records containing only ``regex`` remain
        supported during migration.
        """

        matcher = parser.get(
            "matcher"
        )

        if matcher is not None:
            return matcher

        regex = parser.get(
            "regex"
        )

        if regex:
            return {
                "type": "regex",
                "config": {
                    "pattern": regex,
                },
            }

        return None

    def register(
        self,
        parser_id,
        template,
        regex=None,
        parameter_count=0,
        validation=None,
        matcher=None,
    ):
        """
        Register a validated parser.

        New callers may provide a generic matcher definition.

        Legacy callers may continue providing ``regex``. The regex is
        translated into the generic matcher representation before
        persistence.

        The registry therefore owns parser persistence without
        requiring callers to depend on a particular matching
        implementation.
        """

        if validation is None:
            raise ValueError(
                "Validation result is required."
            )

        matcher_definition = (
            self._registration_matcher(
                matcher=matcher,
                regex=regex,
            )
        )

        existing_id = next(
            (
                parser
                for parser in self.parsers
                if parser["id"] == parser_id
            ),
            None,
        )

        if existing_id:
            raise ValueError(
                f"Parser already exists: {parser_id}"
            )

        existing_pattern = next(
            (
                parser
                for parser in self.parsers
                if (
                    parser.get("template")
                    == template
                    or self._matcher_definition(
                        parser
                    )
                    == matcher_definition
                )
            ),
            None,
        )

        if existing_pattern:
            return existing_pattern

        parser = {
            "id": parser_id,
            "template": template,
            "matcher": matcher_definition,
            "parameter_count": parameter_count,
            "validated": validation["passed"],
            "validation": {
                "coverage": validation[
                    "coverage"
                ],
                "negative_match_rate": validation[
                    "negative_match_rate"
                ],
                "parameter_count_consistent": validation[
                    "parameter_count_consistent"
                ],
            },
        }

        self.parsers.append(parser)
        self.save()

        return parser

    def _registration_matcher(
        self,
        matcher=None,
        regex=None,
    ):
        """
        Normalize registration input into one generic matcher
        definition.

        ``regex`` exists only as a compatibility input for callers
        that have not yet migrated.
        """

        if matcher is not None:
            if not isinstance(
                matcher,
                dict,
            ):
                raise TypeError(
                    "Matcher definition must be a dict."
                )

            if not matcher.get("type"):
                raise ValueError(
                    "Matcher type is required."
                )

            if regex is not None:
                raise ValueError(
                    "Provide matcher or regex, not both."
                )

            return matcher

        if regex:
            return {
                "type": "regex",
                "config": {
                    "pattern": regex,
                },
            }

        raise ValueError(
            "A matcher definition is required."
        )
