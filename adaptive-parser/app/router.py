class LogRouter:
    def __init__(self, registry, unknown_buffer):
        self.registry = registry
        self.unknown_buffer = unknown_buffer

    def process(self, message):
        result = self.registry.match(message)

        if result["matched"]:
            return {
                "status": "known",
                "message": message,
                "parser_id": result["parser_id"],
                "template": result["template"],
                "parameters": result["parameters"],
            }

        self.unknown_buffer.add(message)

        return {
            "status": "unknown",
            "message": message,
            "buffer_size": self.unknown_buffer.count(),
        }
