# Running FastAPI Chatbot with Ollama

This document outlines how to run the FastAPI chatbot application that uses Ollama for LLM responses and RAG capabilities.

## Prerequisites

1. Ollama must be installed and running locally
2. Python 3.9+ installed
3. All required dependencies installed

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements_fastapi_ollama.txt
```

2. Verify Ollama is running:

```bash
ollama list
```

This should show you the available models. The application will try to use these models in order of preference:
- llama3
- llama2
- mistral
- gemma:7b
- phi3

## Running the Application

1. Start the FastAPI server:

```bash
python fastapi_app.py
```

2. Open your browser and navigate to:
   - Web Interface: http://localhost:5000
   - API Documentation: http://localhost:5000/docs

## Configuration

The application looks for the following environment variables in a `.env` file:

- `OLLAMA_BASE_URL`: URL where Ollama is running (default: http://localhost:11434)
- `PORT`: Port to run the server on (default: 5000)
- `FLASK_DEBUG`: Set to "True" for development mode with auto-reload

## API Endpoints

- `GET /`: Web interface for chatbot
- `POST /api/chat`: Send a message and get a response
- `POST /api/clear`: Start a new conversation
- `GET /api/history`: Get conversation history
- `GET /health`: Health check endpoint

## Troubleshooting

- If you see a connection error, make sure Ollama is running (`ollama serve`)
- If you get model errors, check available models with `ollama list` and update the preferred models in `fastapi_app.py`
- For performance issues, try using a smaller model or increase the timeout in the LLM configuration