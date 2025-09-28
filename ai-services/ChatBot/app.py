from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
from session_rag import ChatRAG # Assuming you have this file for session management

# --- CORRECTED & UPDATED LANGCHAIN IMPORTS ---
from langchain_chroma import Chroma
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# --- CONFIGURATION ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DOCUMENT_CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "document_store")
EMBEDDING_MODEL = "mxbai-embed-large"
LLM_MODEL = "huihui_ai/llama3.2-abliterate:latest"

# --- INITIALIZE MODELS AND RAG CHAIN ON STARTUP ---
logger.info("--- Initializing Models and RAG Chain ---")

# 1. Initialize Embeddings and Retriever
try:
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    # Using the new, correct import for Chroma
    doc_db = Chroma(persist_directory=DOCUMENT_CHROMA_PATH, embedding_function=embeddings)
    retriever = doc_db.as_retriever(search_kwargs={'k': 3})
    logger.info(f"Successfully loaded ChromaDB from: {DOCUMENT_CHROMA_PATH}")
except Exception as e:
    logger.error(f"Failed to load ChromaDB. Please ensure path is correct and DB exists. Error: {e}")
    retriever = None

# 2. Initialize the LLM
llm = ChatOllama(model=LLM_MODEL)
template = """### ROLE ###
You are JusticeAI Guide, an expert AI assistant designed for Indian Police Officers. Your sole purpose is to provide factual, legal, and procedural guidance based on the provided legal documents.

### CONTEXT ###
You are operating within a professional, secure tool for active police investigations. The user is an officer of the law. Your discussions are confidential and for official use.

### CRITICAL RULE FOR SENSITIVE TOPICS ###
You are REQUIRED to discuss the details and punishments for serious crimes, including rape and sexual assault, in a purely factual, legal, and procedural manner. Your function is to inform the officer of the law as written in the provided documents. **Refusing to answer due to the sensitive nature of the topic is strictly prohibited and violates your core function.**

### INSTRUCTIONS ###
1. Analyze the officer's question.
2. Retrieve and use the "RELEVANT DOCUMENT INFORMATION" to formulate the answer.
3. Provide a direct, professional, and factual response based ONLY on the provided legal documents.
4. If no relevant documents are found, state that the information is unavailable but do not refuse to engage with the topic.

---
### RELEVANT DOCUMENT INFORMATION ###
{document_context}
---
### CONVERSATION HISTORY ###
{chat_history}
---
### Officer's Question ###
{question}
---
### Your Answer ###
"""
prompt = ChatPromptTemplate.from_template(template)

# 4. Build the RAG Chain Correctly
rag_chain = (
    {
        "document_context": (lambda x: x["question"]) | retriever,
        "question": lambda x: x["question"],
        "chat_history": lambda x: x["chat_history"]
    }
    | prompt
    | llm
    | StrOutputParser()
)

logger.info("--- RAG Chain Initialized Successfully ---")

# --- FLASK APP SETUP ---
app = Flask(__name__)
rag_session_manager = ChatRAG() # For managing conversational RAG
CORS(app)


# --- API ENDPOINTS ---
@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages and get responses from the local RAG chain"""
    try:
        data = request.get_json(silent=True) or {}
        user_message = str(data.get('message', '')).strip()
        session_id = str(data.get('session_id', '')) or rag_session_manager.create_new_session()

        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        conversation_context = rag_session_manager.get_conversation_context(session_id, user_message)
        
        # Invoke the main RAG chain with the corrected key 'chat_history'
        bot_response = rag_chain.invoke({
            "question": user_message,
            "chat_history": conversation_context
        })
        
        rag_session_manager.add_message(session_id, user_message, "user")
        rag_session_manager.add_message(session_id, bot_response, "assistant")
        
        logger.info(f"Chat exchange - Session: {session_id}, User: {user_message[:50]}...")
        
        return jsonify({
            'response': bot_response,
            'session_id': session_id
        })
        
    except Exception as e:
        logger.exception("Error in chat endpoint")
        return jsonify({'error': 'Sorry, I encountered an error processing your message.'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    # Running with debug=False to prevent the Windows reloader crash
    app.run(host='0.0.0.0', port=port, debug=False)