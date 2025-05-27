# CodeShiftAI Gemini Backend

This directory contains the backend implementation for the CodeShiftAI project, leveraging the Gemini language model.

## Overview

The backend provides an API for interacting with the Gemini model, enabling code generation, analysis, and transformation.

## Technologies Used

*   Python
*   Gemini API (or similar)
*   httpx (for asynchronous HTTP requests)
*   uuid (for generating unique request IDs)
*   logging

## Project Structure

*   `app.py`: Likely the main application file (unable to decode content).
*   `gemini_handler.py`: Contains the `GeminiClient` class for interacting with the Gemini API.
*   `prompts.py`: Defines prompts used by the Gemini model.
*   `main.py`: Likely the main entry point for the backend application (unable to decode content).
*   `requirements.txt`: Lists the project dependencies.
*   `tests/`: Contains test files.

## Setup and Usage

1.  **Prerequisites:**
    *   Python 3.8+
    *   pip
    *   A Gemini API key (set as environment variable `GEMINI_API_KEY`)

2.  **Installation:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Configuration:**

    *   Set the Gemini API key as an environment variable: `GEMINI_API_KEY`.
    *   Optionally, configure `GEMINI_API_URL`, `GEMINI_MAX_PROMPT_LENGTH`, and `GEMINI_MAX_TOKENS` environment variables.

4.  **Running the Backend:**

    ```bash
    python app.py  # or python main.py (depending on which file starts the app)
    ```

## API Endpoints

(Further analysis of `app.py` or `main.py` is needed to determine specific API endpoints.)

Example (from `gemini_handler.py`):

The `GeminiClient` class in `gemini_handler.py` provides a `query_gemini` method for sending prompts to the Gemini API.

## Contributing

(Add contribution guidelines here)

## License

(Add license information here)