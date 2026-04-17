from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import requests

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class Message(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "Arthur is alive"}

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
                        "content": """You are ARTHUR, a confined space entry safety system.

You MUST respond ONLY in JSON.

Structure:

{
 "status": "STOP | WARNING | SAFE",
 "what_can_kill_you": [],
 "whats_wrong": [],
 "controls": [],
 "checklist": {
   "gas_test": true/false,
   "monitoring": true/false,
   "standby": true/false,
   "rescue_plan": true/false,
   "permit": true/false
 },
 "details": {
   "people_in_space": number,
   "standby": number,
   "monitoring": "Active/Missing",
   "rescue": "Ready/Missing"
 }
}

No text. JSON only."""
                    },
                    {"role": "user", "content": msg.message}
                ]
            },
            timeout=30
        )

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        return {"response": content}

    except Exception as e:
        return {"error": str(e)}

@app.get("/ui")
def ui():
    return FileResponse("index.html")
