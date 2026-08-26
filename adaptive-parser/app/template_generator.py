from abc import ABC, abstractmethod


class TemplateGenerator(ABC):
    @abstractmethod
    def generate(self, messages):
        pass


class SimpleTemplateGenerator(TemplateGenerator):
    PLACEHOLDER = "<*>"

    def generate(self, messages):
        if not messages:
            raise ValueError("At least one message is required.")

        tokenized = [message.split() for message in messages]

        lengths = {len(tokens) for tokens in tokenized}

        if len(lengths) != 1:
            return None

        template_tokens = []

        for position_tokens in zip(*tokenized):
            first = position_tokens[0]

            if all(token == first for token in position_tokens):
                template_tokens.append(first)
            else:
                template_tokens.append(self.PLACEHOLDER)

        return " ".join(template_tokens)
