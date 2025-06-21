#!/usr/bin/env python3
"""
Test script to verify that the workspace path is being correctly passed 
from VS Code extension to the backend and used by the agent.
"""

import requests
import json

def test_workspace_integration():
    """Test if the backend correctly uses workspace path"""
    
    backend_url = "http://127.0.0.1:8000"
    
    # Test data with workspace path
    test_data = {
        "code": "def hello():\n    print('Hello World')",
        "language": "python",
        "filePath": "test.py",
        "workspacePath": "c:\\Users\\Asus\\Desktop\\Code\\Mindrix\\CodeShiftAI"
    }
    
    print("🧪 Testing workspace integration with CodeShift AI backend...")
    print(f"📁 Testing with workspace path: {test_data['workspacePath']}")
    
    try:
        # Test explain-code endpoint
        print("\n1. Testing /explain-code endpoint with workspace path...")
        response = requests.post(f"{backend_url}/explain-code", json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Explain-code endpoint working!")
            print(f"📄 Response preview: {result.get('result', '')[:100]}...")
        else:
            print(f"❌ Explain-code endpoint failed: {response.status_code}")
            print(f"📄 Error: {response.text}")
            
        # Test chat endpoint
        print("\n2. Testing /chat endpoint with workspace path...")
        chat_data = {
            "message": "use context and analyze this project structure",
            "workspacePath": test_data['workspacePath']
        }
        
        response = requests.post(f"{backend_url}/chat", json=chat_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Chat endpoint working!")
            print(f"📄 Response preview: {result.get('response', '')[:100]}...")
        else:
            print(f"❌ Chat endpoint failed: {response.status_code}")
            print(f"📄 Error: {response.text}")
            
        # Test health endpoint
        print("\n3. Testing /health endpoint...")
        response = requests.get(f"{backend_url}/health", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health endpoint working!")
            print(f"📄 Status: {result.get('status', 'unknown')}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Make sure it's running on http://127.0.0.1:8000")
    except requests.exceptions.Timeout:
        print("❌ Request timed out. Backend might be processing...")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_workspace_integration()
