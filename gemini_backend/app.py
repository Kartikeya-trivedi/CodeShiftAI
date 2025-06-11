from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List
import asyncio
import re
from main import run_agent

app = FastAPI()

# Serve static files (e.g., JS, CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    def clean_response(self, response: str) -> str:
        # Remove ANSI escape sequences
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        response = ansi_escape.sub('', response)

        # Extract content after the last occurrence of "Response"
        if "Response" in response:
            last_part = response.split("Response")[-1]
        else:
            last_part = response

        # Remove box-drawing characters and trim whitespace
        clean_lines = [
            re.sub(r"[┃┏┓┗┛━]+", "", line).strip()
            for line in last_part.splitlines()
            if line.strip()
        ]
        clean_response = "\n".join(clean_lines).strip()
        return clean_response if clean_response else "No response extracted"

    async def send_clean_response(self, response: str, websocket: WebSocket):
        final_output = self.clean_response(response)
        await self.send_message(final_output, websocket)
manager = ConnectionManager()


@app.get("/")
async def root():
    return {"message": "FastAPI backend running for VS Code extension."}

@app.post("/chat")
async def chat_endpoint(request:Request):
    data= await request.json()
    response= await run_agent(data.get("message", ""))
    clean = manager.clean_response(response)
    return {"response": clean}
   
@app.post("/inline-completion")
async def inline_completion(request: Request):
    data = await request.json()
    # If you want to clean the completion, you can do so here
    # For now, just echo back
    return {"message": data}

@app.post("/explain-code")
async def explain_code(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    context = data.get("context", "")
    prompt = f"Explain the following {language} code from {file_path}:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

@app.post("/fix-code")
async def fix_code(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    context = data.get("context", "")
    prompt = f"Fix any issues or bugs in the following {language} code from {file_path}:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

@app.post("/optimize-code")
async def optimize_code(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    context = data.get("context", "")
    prompt = f"Optimize the following {language} code from {file_path} for performance and readability:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

@app.post("/generate-tests")
async def generate_tests(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    context = data.get("context", "")
    prompt = f"Generate unit tests for the following {language} code from {file_path}:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

@app.post("/generate-docs")
async def generate_docs(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    context = data.get("context", "")
    prompt = f"Generate documentation for the following {language} code from {file_path}:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

@app.post("/refactor-code")
async def refactor_code(request: Request):
    data = await request.json()
    code = data.get("code", "")
    language = data.get("language", "")
    file_path = data.get("filePath", "")
    refactor_type = data.get("refactorType", "general")
    context = data.get("context", "")
    prompt = f"Refactor the following {language} code from {file_path} for {refactor_type}:\n{code}\n{context}"
    response = await run_agent(prompt)
    clean = manager.clean_response(response)
    return {"result": clean}

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                response = await run_agent(data)
                await manager.send_clean_response(response, websocket)
            except Exception as e:
                await manager.send_message(f"⚠️ Error: {str(e)}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("🔌 Client disconnected")
    except asyncio.CancelledError:
        manager.disconnect(websocket)
        print("❌ WebSocket cancelled")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"🔥 Unexpected error: {e}")

@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI app started")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 FastAPI app shutting down")
