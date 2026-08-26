from app.template_generator import TemplateGenerator
from app.log_redactor import LogRedactor


class RedactingTemplateGenerator(TemplateGenerator):
    def __init__(
        self,
        generator,
        redactor=None,
    ):
        self.generator = generator
        self.redactor = redactor or LogRedactor()

    @property
    def last_generator(self):
        return getattr(
            self.generator,
            "last_generator",
            None,
        )

    @property
    def last_errors(self):
        return getattr(
            self.generator,
            "last_errors",
            [],
        )

    @property
    def last_attempted_generators(self):
        return getattr(
            self.generator,
            "last_attempted_generators",
            [],
        )

    def generate(self, messages):
        if not messages:
            raise ValueError(
                "At least one message is required."
            )

        safe_messages = [
            self.redactor.redact(message)
            for message in messages
        ]

        return self.generator.generate(
            safe_messages
        )
