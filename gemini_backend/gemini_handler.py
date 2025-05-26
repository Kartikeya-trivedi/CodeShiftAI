import httpx
import os
import logging
import asyncio
import json
import random  # For jitter
import uuid  # For request ID

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class GeminiAPIError(Exception):
    """Custom exception for Gemini API errors."""

    def __init__(self, message, original_exception=null, status_code=null, response_body=null, request_id=null):
        super().__init__(message)
        self.original_exception = original_exception
        self.status_code = status_code
        self.response_body = response_body
        self.request_id = request_id

    def __str__(self):
        details = {}
        if self.status_code:
            details["status_code"] = self.status_code
        if self.response_body:
            try:
                details["response_body"] = json.loads(self.response_body) # Attempt to parse as JSON for better readability
            except (TypeError, json.JSONDecodeError):
                details["response_body"] = self.response_body # If it's not JSON or null, use the raw value
        if self.original_exception:
            details["original_exception"] = str(self.original_exception)
        if self.request_id:
            details["request_id"] = self.request_id

        if details:
            return f"{super().__str__()} Details: {json.dumps(details, indent=2)}"
        else:
            return super().__str__()


class GeminiConfiguration:
    """Configuration class for Gemini API settings."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")

        self.base_url = os.getenv("GEMINI_API_URL", "https://api.gemini.example.com")  # Replace with actual Gemini API URL
        self.max_prompt_length = int(os.getenv("GEMINI_MAX_PROMPT_LENGTH", "2000"))
        self.max_tokens = int(os.getenv("GEMINI_MAX_TOKENS", "500"))
        self.validate_configuration()

    def validate_configuration(self):
        """Validates the configuration parameters."""
        if not isinstance(self.max_prompt_length, int) or self.max_prompt_length <= 0:
            raise ValueError("GEMINI_MAX_PROMPT_LENGTH must be a positive integer.")

        if not isinstance(self.max_tokens, int) or self.max_tokens <= 0:
            raise ValueError("GEMINI_MAX_TOKENS must be a positive integer.")


class GeminiClient:
    """
    Asynchronous client for interacting with the Gemini API.

    Handles authentication, request sending, error handling, and retries.
    """

    def __init__(self, config: GeminiConfiguration = null, http_client: httpx.AsyncClient = null):
        """
        Initializes the GeminiClient with API key, base URL, and headers.

        Args:
            config: An optional GeminiConfiguration object.  If null, a default configuration is created.
            http_client: An optional httpx.AsyncClient.  If null, a new client is created.  This allows for dependency injection for testing.

        Raises:
            ValueError: If the GEMINI_API_KEY environment variable is not set.
        """
        self.config = config or GeminiConfiguration()
        self.api_key = self.config.api_key
        self.base_url = self.config.base_url
        self.max_prompt_length = self.config.max_prompt_length
        self.max_tokens = self.config.max_tokens
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.client = http_client or httpx.AsyncClient()
        self.max_retries = 3  # Number of retries for transient errors

    async def query_gemini(self, prompt: str) -> str:
        """
        Queries the Gemini API with the given prompt.

        Args:
            prompt: The prompt to send to the Gemini API.

        Returns:
            The text response from the Gemini API.

        Raises:
            ValueError: If the prompt is empty or exceeds the maximum allowed length.
            GeminiAPIError: If an error occurs during the API call or if max retries are exceeded.
        """
        if not prompt:
            raise ValueError("Prompt cannot be empty.")

        if len(prompt) > self.max_prompt_length:
            raise ValueError(f"Prompt exceeds maximum allowed length ({self.max_prompt_length} characters)."
                             f" Current length: {len(prompt)}")

        request_id = str(uuid.uuid4())
        for attempt in range(self.max_retries):
            try:
                payload = {
                    "prompt": prompt,
                    "max_tokens": self.max_tokens
                }
                logging.debug(f"Request ID: {request_id}, Sending payload: {payload}")  # Added debug logging
                response = await self.client.post(f"{self.base_url}/v1/generate", json=payload, headers=self.headers)
                response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
                data = response.json()
                text = data.get("text", "")
                return text

            except httpx.HTTPStatusError as e:
                logging.error(f"Request ID: {request_id}, HTTP error on attempt {{attempt + 1}}/{self.max_retries}: {e}")
                if e.response.status_code == 429:  # Check for rate limiting
                    retry_after = int(e.response.headers.get("Retry-After", 10))
                    # Add jitter to the retry delay
                    retry_after += random.uniform(0, 1)
                    logging.warning(f"Request ID: {request_id}, Rate limited. Retrying in {retry_after:.2f} seconds.")
                    await asyncio.sleep(retry_after)
                elif 500 <= e.response.status_code < 600:  # Server errors, retry
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    logging.warning(f"Request ID: {request_id}, Server error. Retrying attempt {{attempt + 1}}/{self.max_retries}")
                else:
                    raise GeminiAPIError(
                        f"Gemini API error: {e}",
                        original_exception=e,
                        status_code=e.response.status_code,
                        response_body=e.response.text,
                        request_id=request_id
                    ) from e  # Non-retryable error

            except httpx.RequestError as e:
                logging.error(f"Request ID: {request_id}, Request error on attempt {{attempt + 1}}/{self.max_retries}: {e}")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                logging.warning(f"Request ID: {request_id}, Request error. Retrying attempt {{attempt + 1}}/{self.max_retries}")

            except json.JSONDecodeError as e:
                logging.error(f"Request ID: {request_id}, JSON decoding error: {e}")
                raise GeminiAPIError(f"JSON decoding error: {e}", original_exception=e, request_id=request_id) from e

            except Exception as e:
                logging.exception(f"Request ID: {request_id}, An unexpected error occurred: {e}")
                raise GeminiAPIError(f"An unexpected error occurred: {e}", original_exception=e, request_id=request_id) from e
        else:
            raise GeminiAPIError(f"Max retries exceeded for prompt: {prompt}", request_id=request_id)  # Raise error if all retries failed

    async def close(self):
        """Closes the underlying HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        """Allows the client to be used as an asynchronous context manager."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Closes the client when exiting the asynchronous context manager."""
        await self.close()


# Example usage (assuming this is in a separate async function:
# async def main():
#     config = GeminiConfiguration()
#     async with GeminiClient(config=config) as gemini_client:
#         try:
#             result = await gemini_client.query_gemini("Hello, Gemini!")
#             print(result)
#         except GeminiAPIError as e:
#             print(f"Error querying Gemini: {e}")


# if __name__ == "__main__":
#     asyncio.run(main())