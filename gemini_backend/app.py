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


@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# WebSocket endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                response = await run_agent(data)

                # Strip ANSI escape sequences from the response
                ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                clean_response = ansi_escape.sub('', response)

                await manager.send_message(f"🤖 Bot: {clean_response.strip()}", websocket)

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

# Optional: graceful startup/shutdown hooks
@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI app started")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 FastAPI app shutting down")
