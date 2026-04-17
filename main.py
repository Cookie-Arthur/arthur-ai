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
    response = client.responses.create(
    model="gpt-4o-mini",
    input=f"You are Arthur, an AI safety oversight system. Be direct, practical and focused on risk.\nUser: {msg.message}"
)

return {"response": response.output_text}
