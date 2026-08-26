from datetime import datetime, timezone


class UnknownBuffer:
    def __init__(self):
        self.logs = []

    def add(self, message):
        entry = {
            "message": message,
            "received_at": datetime.now(timezone.utc).isoformat(),
        }

        self.logs.append(entry)

        return entry

    def count(self):
        return len(self.logs)

    def get_messages(self):
        return [
            entry["message"]
            for entry in self.logs
        ]

    def remove_messages(self, messages):
        messages_to_remove = set(messages)

        self.logs = [
            entry
            for entry in self.logs
            if entry["message"] not in messages_to_remove
        ]

    def clear(self):
        self.logs.clear()
