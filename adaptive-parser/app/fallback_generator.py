class FallbackTemplateGenerator:
    def __init__(self, generators):
        if not generators:
            raise ValueError(
                "At least one template generator is required."
            )

        self.generators = generators

        self.last_generator = None
        self.last_errors = []
        self.last_attempted_generators = []

    def generate(self, messages):
        self.last_generator = None
        self.last_errors = []
        self.last_attempted_generators = []

        for name, generator in self.generators:
            self.last_attempted_generators.append(name)

            try:
                template = generator.generate(messages)

                if template:
                    self.last_generator = name
                    return template

                self.last_errors.append(
                    {
                        "generator": name,
                        "error": "Generator returned no template.",
                    }
                )

            except Exception as exc:
                self.last_errors.append(
                    {
                        "generator": name,
                        "error": str(exc),
                    }
                )

        return None
