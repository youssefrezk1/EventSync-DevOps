import os

from groq import Groq

from app.template_generator import TemplateGenerator


class GroqTemplateGenerator(TemplateGenerator):
    DEFAULT_MODEL = "openai/gpt-oss-20b"

    def __init__(
        self,
        model=None,
    ):
        api_key = os.environ.get("GROQ_API_KEY")

        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set."
            )

        self.client = Groq(
            api_key=api_key
        )

        self.model = (
            model
            or os.environ.get("GROQ_MODEL")
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

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0,
        )

        template = (
            response
            .choices[0]
            .message
            .content
            .strip()
        )

        return template
