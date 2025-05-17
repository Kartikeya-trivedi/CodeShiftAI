#!/bin/bash
export $(grep -v '^#' .env | xargs)
echo "Starting CodeShiftAI Gemini backend server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
