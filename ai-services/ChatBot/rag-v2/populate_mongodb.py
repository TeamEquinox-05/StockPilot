
# --- Connection Details (use environment variables for security) ---
import os
import argparse
import shutil
from pymongo import MongoClient
from langchain.schema.document import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from get_embedding_function import get_embedding_function

# --- Source DB Connection Details (use environment variables) ---
MONGO_URI = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"
DB_NAME = "stockpilot_db_v5" # Your database # populate_local_db.py


# --- Local Vector Store Configuration ---
CHROMA_PATH = "chroma_db"

# --- Collections to Process ---
COLLECTIONS_TO_PROCESS = [
    "products",
    "customers",
    "vendors",
    "sales",
    "purchases"
]

def main():
    # Set up argparse to handle the --reset flag
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset the Chroma database.")
    args = parser.parse_args()
    if args.reset:
        print("✨ Clearing Chroma database")
        clear_database()

    # Initialize MongoDB connection
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    all_chunks = []
    for collection_name in COLLECTIONS_TO_PROCESS:
        print(f"\n--- Processing Collection: {collection_name} ---")
        documents = load_documents_from_mongo(db, collection_name)
        
        if not documents:
            print(f"No documents found in {collection_name}. Skipping.")
            continue
        
        print(f"Loaded {len(documents)} documents.")
        
        chunks = split_documents(documents)
        all_chunks.extend(chunks)
        print(f"Created {len(chunks)} chunks.")

    if not all_chunks:
        print("\nNo data to process. Exiting.")
        return

    print(f"\nAdding {len(all_chunks)} total chunks to ChromaDB...")
    add_to_chroma(all_chunks)
    print("✅ Done.")

# In populate_local_db.py
# In populate_local_db.py
# In populate_local_db.py

def load_documents_from_mongo(db, collection_name: str) -> list[Document]:
    collection = db[collection_name]
    documents = []
    for doc in collection.find():
        page_content = ""
        
        if collection_name == "products":
            page_content = (
                f"Product: {doc.get('product_name', 'N/A')}. "
                f"Category: {doc.get('category', 'N/A')}. "
                f"Description: {doc.get('description', 'N/A')}."
            )
        
        elif collection_name == "customers":
            page_content = (
                f"Customer: {doc.get('customer_name', 'N/A')}. "
                f"Contact: {doc.get('email', 'N/A')}, {doc.get('phone', 'N/A')}."
            )

        # --- ADDED THIS SECTION ---
        elif collection_name == "vendors":
            page_content = (
                f"Vendor: {doc.get('vendor_name', 'N/A')}. "
                f"Contact: {doc.get('email', 'N/A')}. "
                f"Payment Terms: {doc.get('payment_terms', 'N/A')}."
            )

        elif collection_name == "sales":
            page_content = (
                f"Sale Transaction. "
                f"Date: {doc.get('sale_date', 'N/A')}. "
                f"Amount: {doc.get('total_amount', 0)}. "
                f"Payment Mode: {doc.get('payment_mode', 'N/A')}."
            )

        elif collection_name == "purchases":
            page_content = (
                f"Purchase Transaction. "
                f"Bill No: {doc.get('bill_no', 'N/A')}. "
                f"Date: {doc.get('purchase_date', 'N/A')}. "
                f"Status: {doc.get('payment_status', 'N/A')}."
            )
        # --- END OF ADDED SECTION ---
        
        if not page_content:
            continue

        metadata = {
            "source_collection": collection_name,
            "original_id": str(doc.get('_id')) 
        }
        documents.append(Document(page_content=page_content, metadata=metadata))
        
    return documents
def split_documents(documents: list[Document]) -> list[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800, chunk_overlap=80, length_function=len, is_separator_regex=False
    )
    return text_splitter.split_documents(documents)

def add_to_chroma(chunks: list[Document]):
    db = Chroma.from_documents(
        documents=chunks,
        embedding=get_embedding_function(),
        persist_directory=CHROMA_PATH
    )
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

def clear_database():
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)

if __name__ == "__main__":
    main()