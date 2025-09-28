# query_local_db.py
import argparse
import os
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM
from langchain_chroma import Chroma
from typer import prompt
from get_embedding_function import get_embedding_function

# --- Local Vector Store Configuration ---
CHROMA_PATH = "chroma_db"
# In query_local_db.py

PROMPT_TEMPLATE = """
You are a specialized AI assistant for a business named StockPilot. Your name is 'PilotBot'.
Your primary goal is to answer user questions accurately and concisely based exclusively on the context provided below.

**CONTEXT:**
<context>
{context}
</context>

**RULES:**
1.  **Strict Context Adherence:** Scrutinize the provided context carefully. All parts of your answer must be directly supported by this text. Do not add any information that is not in the context.

2.  **Handling No Information:** If the context does not contain the answer, you MUST state: "I don't have enough information to answer that question."

3.  **Handling Similar Information:** If the context is semantically related but doesn't directly answer the question, state what information you DO have. For example, if asked about 'laptops' and the context is about 'computers', say: 'While I don't have specific information on laptops, the context does mention computers.'

4.  **No Calculations:** You are FORBIDDEN from performing calculations, counting items, summing totals, or answering any question requiring math (e.g., "how many", "what is the total"). If asked, respond: "I can provide details on specific items, but I cannot perform calculations."

5.  **Concise Answers:** Keep your answers brief, professional, and to the point.

**QUESTION:**
<question>
{question}
</question>

Based on the context and adhering strictly to the rules, please provide your answer.
"""

def main():
    parser = argparse.ArgumentParser(description="Query the local RAG system.")
    parser.add_argument("query_text", type=str, help="The question to ask the RAG system.")
    args = parser.parse_args()
    query_text = args.query_text
    
    query_rag(query_text)


def query_rag(query_text: str):
    # 1. Prepare the DB connection
    embedding_function = get_embedding_function()
    db = Chroma(
        persist_directory=CHROMA_PATH, 
        embedding_function=embedding_function
    )

    # 2. Search the DB for relevant documents
    print(f"Searching for relevant documents for: '{query_text}'...")
    results = db.similarity_search_with_score(query_text, k=5)
    
    if not results:
        print("No relevant documents found in the database.")
        return

    # 3. Format the context for the prompt
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    print(f"\n--- CONTEXT SENT TO LLM ---\n{context_text}\n--------------------------\n")
    print(f"\n--- PROMPT SENT TO LLM ---\n{prompt}\n--------------------------\n")
    
    # 4. Generate the response using the LLM
    print("Generating response...")
    model = OllamaLLM(model="phi3:mini") # Use the powerful and compact Phi-3 model   
    response_text = model.invoke(prompt)

    # 5. Format and print the final response and sources
    sources = [doc.metadata for doc, _score in results]
    formatted_response = f"\n✅ Response:\n{response_text}\n\n📚 Sources:\n"
    for source in sources:
        formatted_response += f"- Collection: {source.get('source_collection', 'N/A')}, Document ID: {source.get('original_id', 'N/A')}\n"
    
    print(formatted_response)
    return response_text


if __name__ == "__main__":
    main()