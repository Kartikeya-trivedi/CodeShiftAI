FROM python:3.12-slim

# Install uv
RUN pip install uv

WORKDIR /app

# Copy dependency files first for better caching
COPY gemini_backend/pyproject.toml gemini_backend/uv.lock ./

# Install dependencies using uv and the lock file
RUN uv sync --frozen --no-cache

# Copy the entire gemini_backend directory
COPY gemini_backend/ ./

EXPOSE 8000

ENV PYTHONPATH=/app
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

