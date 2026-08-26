import os
from groq import Groq

messages = [
    "Payment TX-100 failed user=41 latency=81ms",
    "Payment TX-200 failed user=72 latency=35ms",
    "Payment TX-300 failed user=19 latency=54ms",
]

prompt = """You are a log template parser.

Given several raw log messages from the same event family:

- Keep all constant text exactly as it appears.
- Replace every changing value with exactly <*>.
- Preserve constant prefixes and suffixes inside tokens.
- Return ONLY the final template.
- Do not explain anything.

Logs:
""" + "\n".join(messages)

client = Groq(api_key=os.environ["GROQ_API_KEY"])

model = os.environ.get(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "user",
            "content": prompt,
        }
    ],
    temperature=0,
)

print(response.choices[0].message.content.strip())
