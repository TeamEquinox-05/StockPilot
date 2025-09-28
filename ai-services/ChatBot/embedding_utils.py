try:
    from langchain_ollama import OllamaEmbeddings
    USING_OLLAMA = True
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    USING_OLLAMA = False

def get_embedding_function():
    """
    Get embedding function that matches the one used in rag-tutorial-v2.
    Must use the exact same embedding model to access the existing database.
    """
    if USING_OLLAMA:
        # Original implementation from rag-tutorial-v2
        return OllamaEmbeddings(model="mxbai-embed-large")
    else:
        # Fallback implementation if Ollama is not available
        # NOTE: This won't work correctly with the existing database
        # because it was created with a different embedding model
        print("WARNING: Using HuggingFace embeddings instead of Ollama. This may not work correctly.")
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )