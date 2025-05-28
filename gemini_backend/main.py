import asyncio
import sys
from prompts import instructions
from pathlib import Path
from agno.agent import Agent
from agno.tools.file import FileTools
from agno.models.google import Gemini
from agno.tools.python import PythonTools
from agno.tools.mcp import MCPTools
from dotenv import load_dotenv
import os
import io
import contextlib
import re

def clean_response(raw_text: str) -> str:
    # Remove ANSI escape sequences
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    text = ansi_escape.sub('', raw_text)

    # Optionally remove box-drawing characters (┏━┃┗ etc.)
    text = re.sub(r'[┏━┓┃┗┛]', '', text)

    # Trim extra whitespace
    text = "\n".join([line.strip() for line in text.splitlines() if line.strip()])
    return text

load_dotenv()

async def run_agent(message: str) -> str:
    """Run the universal coding assistant agent and return the response as string."""

    file_path = str(Path(__file__).parent)

    tools = [
        FileTools(),
        PythonTools(),
        MCPTools(f'npx -y "@modelcontextprotocol/server-filesystem" "{file_path}"'),
    ]

    agent = Agent(
        model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY")),
        tools=tools,
        instructions=instructions,
        markdown=True,
        show_tool_calls=True,
    )

    output_buffer = io.StringIO()
    with contextlib.redirect_stdout(output_buffer):
        await agent.aprint_response(message, stream=True)  # capture the output as string
    return output_buffer.getvalue()

# for CLI use
if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else "what is the classification of a dog?"
    
    print(asyncio.run(run_agent(message)))
