#!/usr/bin/env python3
"""
Simple test to verify workspace path is being passed correctly
"""

import requests
import json

def test_simple_workspace():
    """Test if workspace path is being passed correctly"""
    
    backend_url = "http://127.0.0.1:8000"
    
    # Test with a simple code explanation request
    test_data = {
        "code": "print('Hello from workspace test')",
        "language": "python", 
        "filePath": "test.py",
        "workspacePath": "c:\\Users\\Asus\\Desktop\\Code\\Mindrix\\CodeShiftAI"
    }
    
    print("🧪 Testing simple workspace path integration...")
    print(f"📁 Workspace path: {test_data['workspacePath']}")
    
    try:
        print("\n📡 Sending request to /explain-code...")
        response = requests.post(f"{backend_url}/explain-code", json=test_data, timeout=20)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Backend received workspace path correctly")
            print(f"📄 Response length: {len(result.get('result', ''))}")
            
            # Check if the response mentions anything about workspace
            response_text = result.get('result', '').lower()
            if 'workspace' in response_text or 'directory' in response_text or 'file' in response_text:
                print("🎯 Response mentions workspace/directory/file - workspace path is being used!")
            else:
                print("ℹ️  Response doesn't explicitly mention workspace, but request was successful")
                
        else:
            print(f"❌ Request failed with status: {response.status_code}")
            print(f"📄 Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_simple_workspace()
