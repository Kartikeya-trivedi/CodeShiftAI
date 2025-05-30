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

manager = ConnectionManager()


@app.get("/")
async def root():
    return {"message": "FastAPI backend running for VS Code extension."}

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                response = await run_agent(data)

                
                                # Remove ANSI sequences
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                response = ansi_escape.sub('', response)

                # Extract response content after the last occurrence of "Response"
                if "Response" in response:
                    # Try to extract content after last 'Response' block
                    parts = response.split("Response")
                    last_part = parts[-1]
                    
                    # Remove box characters and extra padding
                    clean_lines = []
                    for line in last_part.splitlines():
                        # Remove border characters and trim whitespace
                        line = re.sub(r"[┃┏┓┗┛━]+", "", line).strip()
                        if line:
                            clean_lines.append(line)

                    clean_response = "\n".join(clean_lines).strip()
                else:
                    clean_response = response.strip()

                # If still empty, fallback
                final_output = clean_response if clean_response else "No response extracted"

                await manager.send_message(final_output, websocket)


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
