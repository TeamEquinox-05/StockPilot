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

db = client['stockpilot_db_v4']  # Using a new database for auto-generated IDs

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
            df = df.drop(columns=['_id'])
        else:
            original_ids = []
        
        # Convert ID fields to ObjectId objects
        id_fields = {
            'product_batches': ['product_id'],
            'purchases': ['vendor_id'],
            'sales': ['customer_id'],
            'purchase_items': ['purchase_id', 'batch_id'],
            'sale_items': ['sale_id', 'batch_id']
        }
        
        # Handle ID references based on collection
        if collection_name in id_fields:
            for id_field in id_fields[collection_name]:
                if id_field in df.columns:
                    # First apply any ID mappings if needed
                    if collection_name == 'product_batches' and id_field == 'product_id' and 'products' in id_mappings:
                        product_id_map = id_mappings['products']
                        df[id_field] = df[id_field].apply(lambda x: product_id_map.get(str(x), x))
                    elif collection_name == 'purchases' and id_field == 'vendor_id' and 'vendors' in id_mappings:
                        vendor_id_map = id_mappings['vendors']
                        df[id_field] = df[id_field].apply(lambda x: vendor_id_map.get(str(x), x))
                    elif collection_name == 'sales' and id_field == 'customer_id' and 'customers' in id_mappings:
                        customer_id_map = id_mappings['customers']
                        df[id_field] = df[id_field].apply(lambda x: customer_id_map.get(str(x), x))
                    elif collection_name == 'purchase_items':
                        if id_field == 'purchase_id' and 'purchases' in id_mappings:
                            purchase_id_map = id_mappings['purchases']
                            df[id_field] = df[id_field].apply(lambda x: purchase_id_map.get(str(x), x))
                        elif id_field == 'batch_id' and 'product_batches' in id_mappings:
                            batch_id_map = id_mappings['product_batches']
                            df[id_field] = df[id_field].apply(lambda x: batch_id_map.get(str(x), x))
                    elif collection_name == 'sale_items':
                        if id_field == 'sale_id' and 'sales' in id_mappings:
                            sale_id_map = id_mappings['sales']
                            df[id_field] = df[id_field].apply(lambda x: sale_id_map.get(str(x), x))
                        elif id_field == 'batch_id' and 'product_batches' in id_mappings:
                            batch_id_map = id_mappings['product_batches']
                            df[id_field] = df[id_field].apply(lambda x: batch_id_map.get(str(x), x))
                            
                    # Now convert the ID string to an actual ObjectId object
                    print(f"Converting {id_field} to ObjectId in {collection_name}")
                    df[id_field] = df[id_field].apply(lambda x: ObjectId(x) if x and isinstance(x, str) else x)
        
        # Convert specific columns to native types
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
        
        # Handle timestamps
        now = pd.Timestamp.now()
        if 'createdAt' in df.columns:
            df['createdAt'] = now
        if 'updatedAt' in df.columns:
            df['updatedAt'] = now

        data = df.to_dict('records')
        
        # Handle NaT values explicitly for all fields
        for item in data:
            for key, value in list(item.items()):
                if pd.isna(value):
                    item[key] = None
        
        # Clear the collection before inserting new data
        collection.delete_many({})
        
        # Insert documents and get their new MongoDB IDs
        result = collection.insert_many(data)
        new_ids = result.inserted_ids
        
        # Create mapping from original IDs to new MongoDB IDs
        if original_ids and len(original_ids) == len(new_ids):
            id_mappings[collection_name] = {str(old_id): str(new_id) 
                                          for old_id, new_id in zip(original_ids, new_ids)}
        
        print(f"✅ Successfully uploaded {len(data)} documents to '{collection_name}' collection.")
        
    except Exception as e:
        print(f"❌ Error processing {collection_name}: {e}")
        import traceback
        traceback.print_exc()

client.close()
print("\n🎉 All data with auto-generated IDs has been uploaded. Connection closed.")