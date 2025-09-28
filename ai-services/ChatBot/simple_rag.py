from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

class SimpleRAG:
    def __init__(self):
        # Set up storage directory
        self.persist_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simple_store")
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2",
            model_kwargs={'device': 'cpu'}
        )
        
        # Initialize vector store with a single collection
        self.vectorstore = Chroma(
            collection_name="all_messages",
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )

    def add_message(self, message: str):
        """Add a single message to the store"""
        self.vectorstore.add_texts([message])
    
    def search_similar(self, query: str, limit: int = 5) -> list[str]:
        """Find similar messages to the query"""
        results = self.vectorstore.similarity_search(query, k=limit)
        return [doc.page_content for doc in results]

    def get_context(self, query: str, limit: int = 5) -> str:
        """Get context from similar messages formatted as a single string"""
        similar_messages = self.search_similar(query, limit)
        return "\n".join(similar_messages)


# Example usage:
if __name__ == "__main__":
    # Initialize
    rag = SimpleRAG()
    
    # Example: Add some messages
    messages = [
        "Python is a high-level programming language",
        "Machine learning requires good data",
        "Natural Language Processing helps computers understand text",
        "Vector embeddings represent text as numbers"
    ]
    
    # Add messages
    for msg in messages:
        rag.add_message(msg)
    
    # Example: Search for similar messages
    query = "What is Python?"
    similar = rag.search_similar(query, limit=2)
    print(f"\nQuery: {query}")
    print("Similar messages:")
    for msg in similar:
        print(f"- {msg}")
    
    # Example: Get context as a single string
    context = rag.get_context(query)
    print("\nContext string:")
    print(context)