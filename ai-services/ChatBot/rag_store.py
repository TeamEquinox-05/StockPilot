from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from datetime import datetime
import json

class ChatRAG:
    def __init__(self):
        import os
        self.persist_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_store")
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.vectorstore = Chroma(
            collection_name="chat_history",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def add_message(self, session_id, message, role):
        # Store message with metadata
        doc_content = json.dumps({
            "message": message,
            "timestamp": str(datetime.now()),
            "role": role
        })
        
        self.vectorstore.add_texts(
            texts=[doc_content],
            metadatas=[{"session_id": session_id}]
        )
        self.vectorstore.persist()

    def get_conversation_context(self, session_id, current_query, max_results=10):
        # Search for relevant messages
        results = self.vectorstore.similarity_search(
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