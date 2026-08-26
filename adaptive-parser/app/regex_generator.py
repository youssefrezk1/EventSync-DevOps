import re


class TemplateRegexGenerator:
    PLACEHOLDER = "<*>"

    def generate(self, template):
        if not template:
            raise ValueError("Template is required.")

        parts = template.split(self.PLACEHOLDER)

        escaped_parts = [
            re.escape(part)
            for part in parts
        ]

        regex = "(.*?)".join(escaped_parts)

        return f"^{regex}$"
