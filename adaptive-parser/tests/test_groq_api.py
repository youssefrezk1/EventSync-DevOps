import os
from groq import Groq

api_key = os.environ.get("GROQ_API_KEY")

if not api_key:
    raise SystemExit("GROQ_API_KEY is not set")

client = Groq(api_key=api_key)

model = os.environ.get(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "user",
            "content": "Reply with exactly: GROQ_OK"
        }
    ],
    temperature=0,
)

print(response.choices[0].message.content)
