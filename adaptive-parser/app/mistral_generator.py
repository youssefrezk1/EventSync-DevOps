import os

from mistralai.client import Mistral

from app.template_generator import TemplateGenerator


class MistralTemplateGenerator(TemplateGenerator):
    DEFAULT_MODEL = "mistral-small-latest"

    def __init__(
        self,
        model=None,
    ):
        api_key = os.environ.get("MISTRAL_API_KEY")

        if not api_key:
            raise RuntimeError(
                "MISTRAL_API_KEY is not set."
            )

        self.client = Mistral(
            api_key=api_key
        )

        self.model = (
            model
            or os.environ.get("MISTRAL_MODEL")
            or self.DEFAULT_MODEL
        )

    def generate(self, messages):
        if not messages:
            raise ValueError(
                "At least one message is required."
            )

        prompt = """You are a log template parser.

Given several structurally validated learning messages from the same event
family, infer one reusable message-level template for that family.

The messages have already passed local structural safety checks.
Runtime values may already be represented by deterministic placeholders
such as <NUM>, <IP>, <UUID>, <VAR>, or similar markers.

Rules:

- Keep true constant text exactly as it appears.
- Replace runtime-changing values with exactly <*>.
- Preserve meaningful constant prefixes or suffixes inside tokens when useful.
  Example: req-781, req-992 -> req-<*>.
- Treat standard runtime values as WHOLE variables, even when part of the value
  happens to be identical across the provided examples.
- In particular, generalize full timestamps, IP addresses, UUIDs, hashes,
  usernames, IDs, ports, durations, counters, sizes, and similar runtime values.
- Do not overfit to the current date, hour, subnet, numeric prefix, or other
  accidental similarities in this small sample.
- The resulting template must generalize to future logs of the same event type.
- Return ONLY the final template.
- Do not explain anything.

Logs:
""" + "\n".join(messages)

        response = self.client.chat.complete(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0,
        )

        return (
            response
            .choices[0]
            .message
            .content
            .strip()
        )
