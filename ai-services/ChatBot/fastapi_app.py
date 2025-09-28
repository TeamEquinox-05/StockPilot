from fastapi import FastAPI, Request, Response, Cookie, HTTPException, Depends, status
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, Union
import os
import uuid
import sys
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from session_rag import ChatRAG
from langchain_ollama import OllamaEmbeddings
from langchain_community.llms import Ollama

# Path to the rag-tutorial-v2 chroma database
rag_tutorial_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rag-tutorial-v2")

# Import Chroma for document retrieval
try:
    from langchain_chroma import Chroma
except ImportError:
    from langchain_community.vectorstores import Chroma

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="AI Chatbot with R-A-G",
    description="A chatbot using Ollama with Retrieval Augmented Generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize templates
templates = Jinja2Templates(directory="templates")

# Initialize RAG
rag = ChatRAG()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Ollama
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
logger.info(f"Using Ollama at: {OLLAMA_BASE_URL}")

# Path to the document RAG database
DOCUMENT_CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "document_store")
if not os.path.exists(DOCUMENT_CHROMA_PATH):
    # Fall back to rag-tutorial-v2 path
    DOCUMENT_CHROMA_PATH = os.path.join(rag_tutorial_path, "chroma")

# Define Pydantic models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class ClearChatResponse(BaseModel):
    message: str
    session_id: str

class HistoryResponse(BaseModel):
    history: str
    session_info: Optional[Dict[str, Any]] = None

def get_document_context(query_text, max_results=5):
    """Get relevant document context based on query."""
    try:
        # Log which database path we're using
        logger.info(f"Using document database at: {DOCUMENT_CHROMA_PATH}")
        
        # Prepare the document DB with Ollama embeddings (same as rag-tutorial-v2)
        embedding_function = OllamaEmbeddings(model="mxbai-embed-large")
        doc_db = Chroma(persist_directory=DOCUMENT_CHROMA_PATH, embedding_function=embedding_function)
        
        # Search the DB
        logger.info(f"Searching for documents related to: '{query_text}'")
        results = doc_db.similarity_search_with_score(query_text, k=max_results)
        logger.info(f"Found {len(results)} relevant documents")
        
        # Format the context
        if not results:
            logger.warning("No document results found for query")
            return ""
            
        context_parts = []
        for doc, score in results:
            # Add document content with source info if available
            source = doc.metadata.get("id", "Unknown source")
            logger.info(f"Found relevant document: {source} with score: {score}")
            context_parts.append(f"Document: {source}\n{doc.page_content}")
        
        document_context = "\n\n---\n\n".join(context_parts)
        return document_context
    except Exception as e:
        logger.exception(f"Error retrieving document context: {e}")
        return ""

def get_model():
    """Configure and return the Ollama LLM model, with fallback options."""
    global OLLAMA_BASE_URL
    if not OLLAMA_BASE_URL:
        OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    
    # Preferred models in order of preference (adjust based on what you have locally)
    preferred_models = [
        'llama3.2:3b'    
    ]
    
    # Get model name from environment if provided
    env_model = os.getenv('OLLAMA_MODEL')
    if env_model:
        preferred_models.insert(0, env_model)
    
    last_error = None
    for model_name in preferred_models:
        try:
            logger.info(f"Attempting to use Ollama model: {model_name}")
            llm = Ollama(
                model=model_name,
                base_url=OLLAMA_BASE_URL,
                temperature=0.7,
                top_p=0.9,
            )
            # Test the model with a simple query to verify it's working
            _ = llm.invoke("Hello")
            logger.info(f"Successfully initialized Ollama model: {model_name}")
            return llm
        except Exception as e:
            last_error = e
            logger.warning(f"Failed to initialize Ollama model '{model_name}': {e}")
    
    # If all fail, raise the last error
    raise RuntimeError(f"Failed to initialize any Ollama model. Last error: {last_error}")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, chat_session_id: Optional[str] = Cookie(None)):
    """Serve the main chatbot interface with session management"""
    # Get session ID from cookie or create a new one
    session_id = chat_session_id
    if not session_id:
        session_id = rag.create_new_session()
    
    # Render template
    response = templates.TemplateResponse("index.html", {"request": request})
    
    # Set session cookie
    response.set_cookie(key="chat_session_id", value=session_id, max_age=60*60*24*30)  # 30 day expiration
    return response

@app.get("/api/ping")
async def ping():
    """Quick connectivity test endpoint."""
    return {"ok": True, "message": "pong"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, chat_session_id: Optional[str] = Cookie(None)):
    """Handle chat messages and get responses from Ollama"""
    try:
        user_message = request.message.strip()
        
        # Get session ID prioritizing request model over cookies
        session_id = request.session_id
        if not session_id:
            session_id = chat_session_id
            if not session_id:
                # Create new session if none exists
                session_id = rag.create_new_session()

        logger.info(f"/api/chat received - session_id={session_id}, bytes={len(user_message)}")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        # Store user message in RAG
        rag.add_message(session_id, user_message, "user")
        
        # Get conversation history context
        conversation_context = rag.get_conversation_context(session_id, user_message)
        
        # Get relevant document context
        document_context = get_document_context(user_message)
        
        # Create prompt with both contexts - formatted for Ollama models
        prompt = f"""You are a helpful AI assistant. Please respond based on the following information:
         
CONVERSATION HISTORY:
{conversation_context}

RELEVANT DOCUMENT INFORMATION:
{document_context}

Current User Message: {user_message}

Respond directly to the user's message. Be helpful, informative, and engaging. Base your response on both the conversation history and relevant document information if available."""
        
        # Generate response using Ollama
        model = get_model()
        bot_response = model.invoke(prompt)
        
        # Store bot response in RAG
        rag.add_message(session_id, bot_response, "assistant")
        
        logger.info(f"Chat exchange - Session: {session_id}, User: {user_message[:50]}...")
        
        # Create response with session cookie
        response = ChatResponse(response=bot_response, session_id=session_id)
        
        # Convert to JSONResponse to set the cookie
        json_response = JSONResponse(content=response.dict())
        json_response.set_cookie(key="chat_session_id", value=session_id, max_age=60*60*24*30)
        return json_response
        
    except ConnectionError as e:
        logger.exception("Connection error with Ollama server")
        raise HTTPException(
            status_code=503, 
            detail="Cannot connect to Ollama server. Make sure Ollama is running on your machine."
        )
    except TimeoutError as e:
        logger.exception("Timeout error with Ollama")
        raise HTTPException(
            status_code=504, 
            detail="Ollama request timed out. The model might be too large or the server is under heavy load."
        )
    except Exception as e:
        logger.exception(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Sorry, I encountered an error processing your message. Check that Ollama is properly configured."
        )

@app.post("/api/clear", response_model=ClearChatResponse)
async def clear_chat(chat_session_id: Optional[str] = Cookie(None)):
    """Create a new session and return its ID"""
    try:
        # Create a new session
        new_session_id = rag.create_new_session()
        
        # Return response with new session cookie
        response = ClearChatResponse(message="New conversation started", session_id=new_session_id)
        
        # Convert to JSONResponse to set the cookie
        json_response = JSONResponse(content=response.dict())
        json_response.set_cookie(key="chat_session_id", value=new_session_id, max_age=60*60*24*30)
        return json_response
        
    except Exception as e:
        logger.error(f"Error clearing chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear chat history")

@app.get("/api/history", response_model=HistoryResponse)
async def get_history(session_id: Optional[str] = None, query: str = "", chat_session_id: Optional[str] = Cookie(None)):
    """Get conversation history using RAG"""
    # Get session ID prioritizing request parameters over cookies
    if not session_id:
        session_id = chat_session_id
        if not session_id:
            raise HTTPException(status_code=400, detail="No session ID provided")
    
    context = rag.get_conversation_context(
        session_id=session_id,
        current_query=query,
        max_results=50
    )
    
    # Get session info
    session_info = rag.get_session_info(session_id)
    
    return HistoryResponse(history=context, session_info=session_info)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Chatbot server is running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting FastAPI server on port {port}")
    print(f"API documentation available at: http://localhost:{port}/docs")
    print(f"Web interface available at: http://localhost:{port}")
    
    if debug:
        # For development with auto-reload
        import subprocess
        cmd = f"uvicorn fastapi_app:app --host 0.0.0.0 --port {port} --reload"
        subprocess.run(cmd, shell=True)
    else:
        # For production without auto-reload
        uvicorn.run(app, host="0.0.0.0", port=port)