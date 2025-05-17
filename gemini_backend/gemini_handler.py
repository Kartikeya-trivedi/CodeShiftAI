import httpx
import os

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.base_url = "https://api.gemini.example.com"  # Replace with actual Gemini API URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def query_gemini(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": prompt,
                "max_tokens": 500
            }
            response = await client.post(f"{self.base_url}/v1/generate", json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data.get("text", "")
