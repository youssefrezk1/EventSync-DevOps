from app.template_generator import TemplateGenerator


class FakeLLMTemplateGenerator(TemplateGenerator):
    def generate(self, messages):
        if not messages:
            raise ValueError("At least one message is required.")

        if all(
            message.startswith("Payment ")
            and " failed user=" in message
            and " latency=" in message
            and message.endswith("ms")
            for message in messages
        ):
            return "Payment <*> failed user=<*> latency=<*>ms"

        if all(
            message.startswith("Database ")
            and message.endswith(" connection failed")
            for message in messages
        ):
            return "Database <*> connection failed"

        return None
