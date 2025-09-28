import os
import shutil
from langchain_community.vectorstores import Chroma
from embedding_utils import get_embedding_function

# Paths
RAG_TUTORIAL_CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rag-tutorial-v2", "chroma")
LOCAL_CHROMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "document_store")

def migrate_chroma_db():
    """
    Migrates the Chroma database from rag-tutorial-v2/chroma to a local document_store.
    This allows us to remove dependency on rag-tutorial-v2 folder.
    """
    print("Starting database migration...")
    
    # Option 1: If shutil copy works for Chroma, use direct copy
    if os.path.exists(RAG_TUTORIAL_CHROMA_PATH):
        # Create destination directory if it doesn't exist
        os.makedirs(LOCAL_CHROMA_PATH, exist_ok=True)
        
        try:
            # Try to copy the database directory (this might work for some Chroma versions)
            print(f"Copying database from {RAG_TUTORIAL_CHROMA_PATH} to {LOCAL_CHROMA_PATH}")
            
            # Clean destination if it exists
            if os.path.exists(LOCAL_CHROMA_PATH):
                for item in os.listdir(LOCAL_CHROMA_PATH):
                    item_path = os.path.join(LOCAL_CHROMA_PATH, item)
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
            
            # Copy all files from source to destination
            for item in os.listdir(RAG_TUTORIAL_CHROMA_PATH):
                source_item = os.path.join(RAG_TUTORIAL_CHROMA_PATH, item)
                dest_item = os.path.join(LOCAL_CHROMA_PATH, item)
                if os.path.isfile(source_item):
                    shutil.copy2(source_item, dest_item)
                elif os.path.isdir(source_item):
                    shutil.copytree(source_item, dest_item)
                    
            print("Database migration completed successfully.")
            return True
        except Exception as e:
            print(f"Error copying database: {e}")
            print("Please keep the rag-tutorial-v2 folder until you can create a new document database.")
            return False
    else:
        print(f"Source database not found at {RAG_TUTORIAL_CHROMA_PATH}")
        print("Please keep the rag-tutorial-v2 folder as it contains your document database.")
        return False

if __name__ == "__main__":
    success = migrate_chroma_db()
    if success:
        print("You can now update app.py to use the new document_store path.")
    else:
        print("Migration failed. Do not delete the rag-tutorial-v2 folder yet.")