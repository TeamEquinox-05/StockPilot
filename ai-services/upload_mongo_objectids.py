import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
import os

# --- 1. CONNECT TO MONGODB ATLAS ---
CONNECTION_STRING = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"

try:
    client = MongoClient(CONNECTION_STRING)
    print("✅ Connected to MongoDB Atlas successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    exit()

db = client['stockpilot_db_v5']  # Using a new database with proper ObjectIds

# --- 2. LIST THE NEW CSV FILES ---
# These filenames match the new schema
csv_files = [
    'vendors.csv',
    'customers.csv',
    'products.csv',
    'product_batches.csv',
    'purchases.csv',
    'purchase_items.csv',
    'sales.csv',
    'sale_items.csv'
]

# --- 3. UPLOAD BASE ENTITIES FIRST ---
# We'll store mapping of old IDs to new MongoDB generated IDs
id_mappings = {}

# Define the order of uploading (base entities first, then dependent entities)
upload_order = [
    ('vendors.csv', 'vendors'),
    ('customers.csv', 'customers'),
    ('products.csv', 'products'),
    ('purchases.csv', 'purchases'),
    ('sales.csv', 'sales'),
    ('product_batches.csv', 'product_batches'),
    ('purchase_items.csv', 'purchase_items'),
    ('sale_items.csv', 'sale_items')
]

# Helper function to safely convert string to ObjectId
def to_object_id(id_str):
    if pd.isna(id_str) or id_str is None or id_str == '':
        return None
    try:
        return ObjectId(str(id_str))
    except Exception as e:
        print(f"Error converting {id_str} to ObjectId: {e}")
        return None

# Process files in the specified order
for file_path, collection_name in upload_order:
    if not os.path.exists(file_path):
        print(f"⚠️ File not found for {collection_name}, skipping")
        continue
    
    try:
        collection = db[collection_name]
        df = pd.read_csv(file_path)
        
        # Store original IDs before dropping the column
        if '_id' in df.columns:
            original_ids = df['_id'].tolist()
            # Convert the _id column from string to ObjectId
            df['_id'] = df['_id'].apply(to_object_id)
        else:
            original_ids = []
            # Let MongoDB generate new IDs
            df = df.drop(columns=['_id'], errors='ignore')
        
        # Convert ID references based on collection
        # Define which fields should be converted to ObjectId
        id_fields = {
            'product_batches': ['product_id'],
            'purchases': ['vendor_id'],
            'sales': ['customer_id'],
            'purchase_items': ['purchase_id', 'batch_id'],
            'sale_items': ['sale_id', 'batch_id']
        }
        
        # Convert foreign key ID fields to ObjectId
        if collection_name in id_fields:
            for id_field in id_fields[collection_name]:
                if id_field in df.columns:
                    print(f"Converting {id_field} to ObjectId in {collection_name}")
                    df[id_field] = df[id_field].apply(to_object_id)
        
        # Convert date fields
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
        
        # Update timestamps if needed
        now = pd.Timestamp.now()
        if 'createdAt' in df.columns:
            df['createdAt'] = pd.to_datetime(df['createdAt'])
        if 'updatedAt' in df.columns:
            df['updatedAt'] = pd.to_datetime(df['updatedAt'])

        # Convert DataFrame to list of dictionaries
        data = df.to_dict('records')
        
        # Handle NaT and NaN values explicitly
        for item in data:
            for key, value in list(item.items()):
                if pd.isna(value):
                    item[key] = None
        
        # Clear the collection before inserting new data
        collection.delete_many({})
        
        # Insert documents
        if data:
            result = collection.insert_many(data)
            print(f"✅ Successfully uploaded {len(data)} documents to '{collection_name}' collection.")
        else:
            print(f"⚠️ No data to upload for {collection_name}")
        
    except Exception as e:
        print(f"❌ Error processing {collection_name}: {e}")
        import traceback
        traceback.print_exc()

client.close()
print("\n🎉 All data with proper ObjectIds has been uploaded. Connection closed.")