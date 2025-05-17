from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gemini_handler import GeminiClient
from prompts import build_prompt

app = FastAPI()
client = GeminiClient()

class CodeRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate_code(request: CodeRequest):
    try:
        prompt_text = build_prompt(request.prompt)
        response = await client.query_gemini(prompt_text)
        return {"result": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
