from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI

# Initialize client with API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Input model
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
        response = client.responses.create(
            model="gpt-4o-mini",
            input=f"You are Arthur, an AI safety oversight system. Be direct, practical, and focused on risk.\nUser: {msg.message}"
        )

        return {"response": response.output_text}

    except Exception as e:
        return {"error": str(e)}
