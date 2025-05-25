import httpx
import os
import logging
import asyncio  # Import asyncio for sleep

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class GeminiAPIError(Exception):
    """Custom exception for Gemini API errors."""
    pass

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        self.base_url = os.getenv("GEMINI_API_URL", "https://api.gemini.example.com")  # Replace with actual Gemini API URL, allow override via env
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.client = httpx.AsyncClient()
        self.max_retries = 3  # Number of retries for transient errors

    async def query_gemini(self, prompt: str) -> str:
        if not prompt:
            raise ValueError("Prompt cannot be empty.")

        if len(prompt) > 2000:  # Example max prompt length
            raise ValueError("Prompt exceeds maximum allowed length (2000 characters).")
        
        for attempt in range(self.max_retries):
            try:
                payload = {
                    "prompt": prompt,
                    "max_tokens": 500
                }
                response = await self.client.post(f"{self.base_url}/v1/generate", json=payload, headers=self.headers)
                response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
                data = response.json()
                text = data.get("text", "")
                return text

            except httpx.HTTPStatusError as e:
                logging.error(f"HTTP error: {e}")
                if e.response.status_code == 429:  # Check for rate limiting
                    retry_after = int(e.response.headers.get("Retry-After", 10))  #Respect Retry-After header
                    logging.warning(f"Rate limited.  Retrying in {retry_after} seconds.")
                    await asyncio.sleep(retry_after)
                elif 500 <= e.response.status_code < 600: #Server errors, retry
                    await asyncio.sleep(2**attempt) #Exponential backoff
                    logging.warning(f"Server error. Retrying attempt {attempt + 1}/{self.max_retries}")

                else:
                    raise GeminiAPIError(f"Gemini API error: {e}") from e #Non-retryable error

            except httpx.RequestError as e:
                logging.error(f"Request error: {e}")
                await asyncio.sleep(2**attempt) #Exponential backoff
                logging.warning(f"Request error. Retrying attempt {attempt + 1}/{self.max_retries}")


            except ValueError as e:
                logging.error(f"JSON decoding error: {e}")
                raise GeminiAPIError(f"JSON decoding error: {e}") from e

            except Exception as e:
                logging.exception(f"An unexpected error occurred: {e}")
                raise GeminiAPIError(f"An unexpected error occurred: {e}") from e
        else:
            raise GeminiAPIError(f"Max retries exceeded for prompt: {prompt}") # Raise error if all retries failed


    async def close(self):
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Example usage (assuming this is in a separate async function):
# async def main():
#     async with GeminiClient() as gemini_client:
#         try:
#             result = await gemini_client.query_gemini("Hello, Gemini!")
#             print(result)
#         except GeminiAPIError as e:
#             print(f"Error querying Gemini: {e}")

# if __name__ == "__main__":
#     asyncio.run(main())