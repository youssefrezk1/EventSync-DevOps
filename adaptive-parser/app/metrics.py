class EngineMetrics:
    def __init__(self):
        self.total_logs = 0

        self.known_logs = 0
        self.buffered_logs = 0
        self.unknown_logs = 0
        self.learned_and_parsed_logs = 0

        self.parsers_learned = 0

        self.template_generation_calls = 0

        self.groq_attempts = 0
        self.groq_successes = 0

        self.mistral_attempts = 0
        self.mistral_successes = 0

        self.fallback_uses = 0

    def snapshot(self):
        return {
            "total_logs": self.total_logs,
            "known_logs": self.known_logs,
            "buffered_logs": self.buffered_logs,
            "unknown_logs": self.unknown_logs,
            "learned_and_parsed_logs": self.learned_and_parsed_logs,
            "parsers_learned": self.parsers_learned,
            "template_generation_calls": self.template_generation_calls,
            "groq_attempts": self.groq_attempts,
            "groq_successes": self.groq_successes,
            "mistral_attempts": self.mistral_attempts,
            "mistral_successes": self.mistral_successes,
            "fallback_uses": self.fallback_uses,
        }
