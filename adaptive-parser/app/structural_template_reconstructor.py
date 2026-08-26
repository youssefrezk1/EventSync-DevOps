import re

from app.structural_reconstruction_plan_builder import (
    StructuralReconstructionPlanBuilder,
)


class StructuralTemplateReconstructor:
    """
    Reconstructs a raw-compatible parser template from:

      1. locally authorized envelope structure; and
      2. a message-level learned template.

    This component is format-independent.

    It does not classify raw inputs by serialization, framework,
    language, platform, or application type.
    """

    PARSER_PLACEHOLDER = "<*>"

    INTERNAL_PLACEHOLDER = re.compile(
        r"<(?:"
        r"NUM|"
        r"IP|"
        r"UUID|"
        r"TIMESTAMP|"
        r"EMAIL|"
        r"SECRET|"
        r"VAR|"
        r"ENTITY"
        r")>",
        re.IGNORECASE,
    )

    def __init__(
        self,
        plan_builder=None,
    ):
        self.plan_builder = (
            plan_builder
            or StructuralReconstructionPlanBuilder()
        )

    def can_reconstruct(
        self,
        raw_messages,
    ):
        plan = self.plan_builder.build(
            raw_messages
        )

        return plan.authorized

    def reconstruct(
        self,
        raw_messages,
        message_template,
    ):
        if not message_template:
            raise ValueError(
                "Message template is required."
            )

        plan = self.plan_builder.build(
            raw_messages
        )

        if not plan.authorized:
            return None

        normalized_message_template = (
            self.INTERNAL_PLACEHOLDER.sub(
                self.PARSER_PLACEHOLDER,
                message_template,
            )
        )

        output = []

        for segment in plan.segments:

            if segment.kind == "literal":
                output.append(
                    segment.value
                )
                continue

            if segment.kind == "wildcard":
                output.append(
                    self.PARSER_PLACEHOLDER
                )
                continue

            if segment.kind == "message":
                output.append(
                    normalized_message_template
                )
                continue

            # Unknown reconstruction instructions fail closed.
            return None

        template = "".join(
            output
        )

        if not template:
            return None

        return template
