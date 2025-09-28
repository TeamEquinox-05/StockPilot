from langchain_ollama import OllamaEmbeddings


def get_embedding_function():
    # Using Ollama's mxbai-embed-large model for embeddings
    embeddings = OllamaEmbeddings(model="mxbai-embed-large")
    return embeddings
