import os
import sys
import logging
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the rag-tutorial-v2 directory to the path
rag_tutorial_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rag-tutorial-v2")

def get_ollama_embedding():
    """Get the Ollama embedding function - same as in rag-tutorial-v2"""
    return OllamaEmbeddings(model="mxbai-embed-large")

def test_document_retrieval():
    """Test document retrieval from both databases"""
    # Test query
    test_query = "What is the POCSO Act and what are the punishments?"
    
    # Test both database locations
    original_db_path = os.path.join(rag_tutorial_path, "chroma")
    migrated_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "document_store")
    
    for name, db_path in [("Original", original_db_path), ("Migrated", migrated_db_path)]:
        if not os.path.exists(db_path):
            print(f"{name} database path does not exist: {db_path}")
            continue
            
        print(f"\nTesting {name.upper()} database:")
        print(f"Database path: {db_path}")
        
        try:
            # Get embedding function
            embedding_function = get_ollama_embedding()
            
            # Load database
            db = Chroma(persist_directory=db_path, embedding_function=embedding_function)
            
            # Search
            results = db.similarity_search_with_score(test_query, k=3)
            
            print(f"Found {len(results)} results")
            for i, (doc, score) in enumerate(results):
                print(f"Result {i+1} (score: {score}):")
                print(f"Metadata: {doc.metadata}")
                print(f"Content: {doc.page_content[:200]}...")
                print("-" * 50)
        except Exception as e:
            print(f"Error with {name} database: {str(e)}")

if __name__ == "__main__":
    test_document_retrieval()