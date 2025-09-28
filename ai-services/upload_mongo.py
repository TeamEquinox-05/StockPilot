import pandas as pd
from pymongo import MongoClient
import os

# --- 1. CONNECT TO MONGODB ATLAS ---
CONNECTION_STRING = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"

try:
    client = MongoClient(CONNECTION_STRING)
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit()

db = client['stockpilot_db_v3'] # Using a new database for the new schema

# --- 2. LIST THE NEW CSV FILES ---
# These filenames match the new schema
csv_files_to_upload = {
    'vendors.csv': 'vendors',
    'customers.csv': 'customers',
    'products.csv': 'products',
    'product_batches.csv': 'product_batches',
    'purchases.csv': 'purchases',
    'purchase_items.csv': 'purchase_items',
    'sales.csv': 'sales',
    'sale_items.csv': 'sale_items'
}

# --- 3. UPLOAD EACH FILE TO ITS COLLECTION ---
for file_path, collection_name in csv_files_to_upload.items():
    if os.path.exists(file_path):
        try:
            collection = db[collection_name]
            df = pd.read_csv(file_path)
            
            # Remove _id column to let MongoDB create it automatically
            if '_id' in df.columns:
                df = df.drop(columns=['_id'])
                
            # Convert specific columns to native types where needed
            if 'purchase_date' in df.columns:
                df['purchase_date'] = pd.to_datetime(df['purchase_date'])
            if 'sale_date' in df.columns:
                df['sale_date'] = pd.to_datetime(df['sale_date'])
            if 'expiry_date' in df.columns:
                # First make sure empty strings are NaN
                df['expiry_date'] = df['expiry_date'].replace('', float('nan'))
                # Handle NaN/None values in expiry_date
                df['expiry_date'] = pd.to_datetime(df['expiry_date'], errors='coerce')
                # Replace NaT values with None (null in MongoDB)
                df['expiry_date'] = df['expiry_date'].where(pd.notnull(df['expiry_date']), None)

            # Convert DataFrame to list of dictionaries and ensure proper handling of datetime objects
            data = df.to_dict('records')
            
            # Process the data before insertion to handle NaT values explicitly
            if collection_name == 'product_batches':
                for item in data:
                    if 'expiry_date' in item and pd.isna(item['expiry_date']):
                        item['expiry_date'] = None
            
            # Clear the collection before inserting new data
            collection.delete_many({})
            collection.insert_many(data)
            
            print(f"✅ Successfully uploaded {len(data)} documents to '{collection_name}' collection.")
            
        except Exception as e:
            print(f"❌ Error processing file {file_path}: {e}")
    else:
        print(f"⚠️ File not found, skipping: {file_path}")

client.close()
print("\n🎉 All data for the new schema has been uploaded. Connection closed.")