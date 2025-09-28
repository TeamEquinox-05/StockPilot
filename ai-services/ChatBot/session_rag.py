from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from datetime import datetime
import json
import os
import uuid

class ChatRAG:
    def __init__(self):
        """Initialize the ChatRAG with session-based storage."""
        self.base_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_sessions")
        os.makedirs(self.base_directory, exist_ok=True)
        
        # Use the same embedding model as document store for consistency
        self.embeddings = OllamaEmbeddings(model="mxbai-embed-large")
        
        # Track active session instances
        self.active_sessions = {}

    def _get_session_directory(self, session_id):
        """Get the directory path for a specific session."""
        session_dir = os.path.join(self.base_directory, session_id)
        os.makedirs(session_dir, exist_ok=True)
        return session_dir

    def _get_session_vectorstore(self, session_id):
        """Get or create a vector store for the session."""
        # Check if we already have this session loaded
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]
        
        # Create new session vectorstore
        session_dir = self._get_session_directory(session_id)
        vectorstore = Chroma(
            collection_name=f"chat_{session_id}",
            embedding_function=self.embeddings,
            persist_directory=session_dir
        )
        
        # Cache for future use
        self.active_sessions[session_id] = vectorstore
        return vectorstore

    def add_message(self, session_id, message, role):
        """Add a message to the session's vector store."""
        # Get the session's vector store
        vectorstore = self._get_session_vectorstore(session_id)
        
        # Store message with metadata
        doc_content = json.dumps({
            "message": message,
            "timestamp": str(datetime.now()),
            "role": role
        })
        
        # Add to vector store with session metadata
        vectorstore.add_texts(
            texts=[doc_content],
            metadatas=[{"session_id": session_id, "role": role}]
        )
        
        # Persist to disk for this session
        vectorstore.persist()
        
        # Update session metadata
        self._update_session_metadata(session_id, role)

    def _update_session_metadata(self, session_id, role):
        """Update the session metadata file with latest activity."""
        session_dir = self._get_session_directory(session_id)
        metadata_path = os.path.join(session_dir, "metadata.json")
        
        # Create or load existing metadata
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {
                "session_id": session_id,
                "created_at": str(datetime.now()),
                "message_count": 0
            }
        
        # Update metadata
        metadata["last_active"] = str(datetime.now())
        metadata["message_count"] += 1
        metadata[f"last_{role}_message"] = str(datetime.now())
        
        # Save updated metadata
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

    def get_conversation_context(self, session_id, current_query, max_results=10):
        """Get relevant conversation context for the current query."""
        # Get the session's vector store
        try:
            vectorstore = self._get_session_vectorstore(session_id)
            
            # Search for relevant messages within this session
            results = vectorstore.similarity_search(
                current_query,
                filter={"session_id": session_id},
                k=max_results
            )
            
            # Format conversation context
            context = []
            for doc in results:
                message_data = json.loads(doc.page_content)
                context.append(f"{message_data['role']}: {message_data['message']}")
                
            return "\n".join(context)
        except Exception as e:
            # If anything fails, return empty context
            print(f"Error retrieving conversation context: {e}")
            return ""

    def get_active_sessions(self):
        """Get a list of all active session IDs."""
        return [d for d in os.listdir(self.base_directory) 
                if os.path.isdir(os.path.join(self.base_directory, d))]

    def get_session_info(self, session_id):
        """Get information about a specific session."""
        session_dir = self._get_session_directory(session_id)
        metadata_path = os.path.join(session_dir, "metadata.json")
        
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                return json.load(f)
        return None

    def create_new_session(self):
        """Create a new session and return its ID."""
        session_id = str(uuid.uuid4())
        self._get_session_directory(session_id)  # Create directory
        self._update_session_metadata(session_id, "system")  # Initialize metadata
        return session_id