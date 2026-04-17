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
                        "content": """You are ARTHUR, an AI Safety Oversight System.

You operate like a Permit Controller, not a teacher.

RULES:
- No generic safety advice
- No training-style answers
- No long explanations

You must:
- Identify the actual scenario
- Give ONLY relevant critical controls
- Be specific to oil & gas / high-risk work
- Speak like a supervisor stopping unsafe work

Always respond in this structure:

STATUS: [STOP / WARNING / SAFE]

WHAT CAN KILL YOU:
- (only real hazards relevant to scenario)

WHAT'S WRONG:
- (what is missing or unclear)

CRITICAL CONTROLS:
- (only the controls that actually matter)

DECISION:
- GO / NO GO with condition

Keep it sharp. No fluff. No filler."""
                    },
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
import os

@app.get("/ui")
def ui():
    file_path = os.path.join(os.getcwd(), "index.html")
    return FileResponse(file_path)
