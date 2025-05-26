import asyncio
import sys
from prompts import instructions
from pathlib import Path
from textwrap import dedent
from agno.tools.file import FileTools
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.python import PythonTools
from agno.tools.mcp import MCPTools
from dotenv import load_dotenv
import os

load_dotenv()

async def run_agent(message: str) -> None:
    """Run the universal coding assistant agent with the given message."""
    try:
        file_path = str(Path(__file__).parent)
        
        # Initialize all available tools with correct parameters
        tools = [
            FileTools(),
            PythonTools(),
            MCPTools(f'npx -y "@modelcontextprotocol/server-filesystem" "{file_path}"')
        ]


        agent = Agent(
            model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY")),
            tools=tools,
            instructions=instructions,
            markdown=True,
            show_tool_calls=True,
        )

        await agent.aprint_response(message, stream=True)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise


# Example usage
if __name__ == "__main__":
    # Get message from command line args or use default
    message = sys.argv[1] if len(sys.argv) > 1 else "Analyze this project and suggest improvements"
    asyncio.run(run_agent(message)) 