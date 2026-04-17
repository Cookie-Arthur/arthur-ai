from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import requests

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class Message(BaseModel):
    message: str

# Health check
@app.get("/")
def home():
    return {"message": "Arthur is alive"}

# Chat endpoint
@app.post("/chat")
async def chat(msg: Message):
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": """
You are ARTHUR, an AI Safety Oversight System.

You DO NOT give generic advice.
You issue CLEAR operational decisions.

Always respond in this exact structure:

STATUS: [STOP / WARNING / SAFE]

WHAT CAN KILL YOU:
- ...

WHAT'S WRONG:
- ...

REQUIRED CONTROLS:
- ...

DECISION:
- ...

Be direct. Be firm. No fluff.
""",}
                    {
                        "role": "user",
                        "content": msg.message
                    }
                ]
            },
            timeout=30
        )

        data = response.json()

        return {
            "response": data["choices"][0]["message"]["content"]
        }

    except Exception as e:
        return {"error": str(e)}

# UI route
@app.get("/ui")
def ui():
    return FileResponse("index.html")
