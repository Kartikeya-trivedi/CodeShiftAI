#!/usr/bin/env python3
"""
Test script to verify workspace integration is working correctly.
This script tests if the AI agent actually uses the provided workspace path
instead of defaulting to the backend directory.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "gemini_backend"
sys.path.insert(0, str(backend_path))

# Change to a different directory to test workspace path handling
original_cwd = os.getcwd()
temp_test_dir = Path(__file__).parent / "tmp"
temp_test_dir.mkdir(exist_ok=True)
os.chdir(temp_test_dir)

try:
    from main import run_agent

    async def test_workspace_integration():
        """Test that the agent uses the provided workspace path."""
          # Test workspace path (should be different from current working directory)
        test_workspace = str(Path(__file__).parent.parent / "Codeshift_website")
        current_dir = os.getcwd()
        
        print(f"Current working directory: {current_dir}")
        print(f"Test workspace path: {test_workspace}")
        print("-" * 60)
        
        # Test message that should list files in the workspace
        test_message = "List all files in the current workspace directory. Show me what files are available."
        
        print("Sending test message to agent...")
        print(f"Message: {test_message}")
        print("-" * 60)
        
        # Run the agent with the workspace path
        response = await run_agent(test_message, test_workspace)
        
        print("Agent Response:")
        print(response)
        print("-" * 60)
        
        # Check if the response contains files from the workspace (not backend)
        workspace_files = ["README.md", "Backend", "Frontend", "test_api_register.py"]
        backend_files = ["app.py", "main.py", "prompts.py", "requirements.txt"]
        
        workspace_file_found = any(file in response for file in workspace_files)
        backend_file_found = any(file in response for file in backend_files)
        
        print("Analysis:")
        print(f"Workspace files found in response: {workspace_file_found}")
        print(f"Backend files found in response: {backend_file_found}")
        
        if workspace_file_found and not backend_file_found:
            print("✅ SUCCESS: Agent is correctly using the workspace directory!")
        elif backend_file_found and not workspace_file_found:
            print("❌ FAILURE: Agent is still using the backend directory")
        elif workspace_file_found and backend_file_found:
            print("⚠️  WARNING: Agent found files from both directories")
        else:
            print("❓ UNCLEAR: Could not determine which directory was used")
        
        return response

    if __name__ == "__main__":
        print("Testing workspace integration...")
        print("=" * 60)
        
        # Run the test
        asyncio.run(test_workspace_integration())
        
finally:
    # Restore original working directory
    os.chdir(original_cwd)
