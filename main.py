from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class Message(BaseModel):
    message: str

@app.get("/")
def home():
    return {"message": "Arthur is alive"}

@app.post("/chat")
async def chat(msg: Message):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are Arthur, an AI safety oversight system. Be direct, practical and focused on risk."},
            {"role": "user", "content": msg.message}
        ]
    )
    return {"response": response.choices[0].message.content}
