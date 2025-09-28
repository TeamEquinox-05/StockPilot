import pandas as pd
from faker import Faker
import numpy as np
import random
import json
from datetime import datetime, timedelta

# Note: You may need to install the 'pymongo' package for this:
# pip install pymongo
try:
    from bson import ObjectId
except ImportError:
    print("⚠️ bson module not found. Installing pymongo...")
    import subprocess
    subprocess.check_call(["pip", "install", "pymongo"])
    from bson import ObjectId

print("🚀 Starting Initial Data Generation (v3) with MongoDB Schema...")

# --- 1. SETUP ---
try:
    with open('products.json', 'r') as f:
        raw_data = json.load(f)
except FileNotFoundError:
    print("❌ Error: products.json not found. Make sure it's in the same folder.")
    exit()

fake = Faker('en_IN')

# Helper function to generate ObjectId
def generate_object_id():
    return str(ObjectId())

# Helper function to generate timestamps
def generate_timestamps():
    created = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]+'+00:00'
    return created, created

# --- 2. VENDORS ---
vendors_data = []
vendor_id_map = {}  # Map to store vendor name to ObjectId
for i, name in enumerate(sorted(list(set([p['companyName'] for p in raw_data])))):
    vendor_id = generate_object_id()
    vendor_id_map[name] = vendor_id
    created_at, updated_at = generate_timestamps()
    
    vendors_data.append({
        '_id': vendor_id,
        'vendor_name': name,
        'phone': fake.phone_number(),
        'email': f"contact@{name.split(' ')[0].lower().replace('.', '')}.com",
        'address': fake.address().replace('\n', ', '),
        'gst_number': fake.bothify(text='##AAAAA####A#Z#') if random.random() > 0.7 else "",
        'payment_terms': random.choice(['Net 15', 'Net 30', 'Net 60']),
        'createdAt': created_at,
        'updatedAt': updated_at,
        '__v': 0
    })
df_vendors = pd.DataFrame(vendors_data)
df_vendors.to_csv('vendors.csv', index=False)
print("✅ Created vendors.csv")

# --- 3. CUSTOMERS ---
customers_data = []
for i in range(50):
    created_at, updated_at = generate_timestamps()
    customers_data.append({
        '_id': generate_object_id(),
        'customer_name': fake.name(),
        'phone': fake.phone_number(),
        'email': fake.email(),
        'address': fake.address().replace('\n', ', '),
        'gst_number': fake.bothify(text='##AAAAA####A#Z#') if random.random() > 0.7 else "",
        'createdAt': created_at,
        'updatedAt': updated_at,
        '__v': 0
    })
df_customers = pd.DataFrame(customers_data)
df_customers.to_csv('customers.csv', index=False)
print("✅ Created customers.csv")

# --- 4. PRODUCTS ---
product_id_map = {}  # Map to store product name to ObjectId
products_data = []
for name in sorted(list(set([p['productName'] for p in raw_data]))):
    product_id = generate_object_id()
    product_id_map[name] = product_id
    created_at, updated_at = generate_timestamps()
    
    products_data.append({
        '_id': product_id,
        'product_name': name,
        'category': 'Pet Supplies',
        'hsn_code': fake.bothify(text='####.##.##'),
        'description': f'High-quality {name} for pets.',
        'createdAt': created_at,
        'updatedAt': updated_at,
        '__v': 0
    })
df_products = pd.DataFrame(products_data)
df_products.to_csv('products.csv', index=False)
print("✅ Created products.csv")

# --- 5. PURCHASES, PURCHASE_ITEMS, and PRODUCT_BATCHES ---
purchases = []
purchase_items = []
product_batches = []

# Group raw items by vendor to create consolidated purchase orders
items_by_vendor = {}
for item in raw_data:
    vendor_name = item['companyName']
    if vendor_name not in items_by_vendor:
        items_by_vendor[vendor_name] = []
    items_by_vendor[vendor_name].append(item)

for vendor_name, items in items_by_vendor.items():
    # Generate purchase document
    purchase_id = generate_object_id()
    purchase_date = fake.date_time_between(start_date='-1y', end_date='-181d')
    vendor_id = vendor_id_map[vendor_name]
    total_purchase_amount = 0
    purchase_created_at, purchase_updated_at = generate_timestamps()

    batch_item_pairs = []  # To store batch_id and corresponding purchase_item_id

    for i, item in enumerate(items):
        # Generate batch document
        batch_id = generate_object_id()
        product_name_full = item['productName']
        product_id = product_id_map[product_name_full]
        quantity = item['quantity']
        mrp = item['rate']
        purchase_rate = round(mrp * random.uniform(0.6, 0.8), 2)
        tax = random.choice([5, 12, 18])
        discount = random.choice([0, 5, 10])
        
        total_purchase_amount += quantity * purchase_rate * (1 + tax/100) * (1 - discount/100)
        batch_created_at, batch_updated_at = generate_timestamps()

        # Create Product Batch with MongoDB schema
        # Make expiry_date null in 20% of cases
        expiry_date = None if random.random() < 0.2 else (purchase_date.date() + pd.Timedelta(days=random.randint(180, 500))).strftime('%Y-%m-%dT%H:%M:%S.000+00:00')
        
        product_batches.append({
            '_id': batch_id,
            'product_id': product_id,
            'batch_number': fake.bothify(text='BN-?#?#?#').upper(),
            'barcode': "",  # Empty barcode as per your schema
            'expiry_date': expiry_date,
            'mrp': mrp,
            'quantity_in_stock': quantity,
            'createdAt': batch_created_at,
            'updatedAt': batch_updated_at,
            '__v': 0
        })

        # Create Purchase Item with MongoDB schema
        purchase_item_id = generate_object_id()
        purchase_item_created_at, purchase_item_updated_at = generate_timestamps()
        
        purchase_items.append({
            '_id': purchase_item_id,
            'purchase_id': purchase_id,
            'batch_id': batch_id,
            'quantity': quantity,
            'purchase_rate': purchase_rate,
            'tax_percent': tax,
            'discount_percent': discount,
            'createdAt': purchase_item_created_at,
            'updatedAt': purchase_item_updated_at,
            '__v': 0
        })

    # Create Purchase with MongoDB schema
    purchases.append({
        '_id': purchase_id,
        'vendor_id': vendor_id,
        'bill_no': f'INV-{random.randint(1000, 9999)}',
        'purchase_date': purchase_date.strftime('%Y-%m-%dT%H:%M:%S.000+00:00'),
        'total_amount': round(total_purchase_amount, 2),
        'payment_status': random.choice(['Paid', 'Pending']),
        'createdAt': purchase_created_at,
        'updatedAt': purchase_updated_at,
        '__v': 0
    })

df_purchases = pd.DataFrame(purchases)
df_purchase_items = pd.DataFrame(purchase_items)
df_product_batches = pd.DataFrame(product_batches)

df_purchases.to_csv('purchases.csv', index=False)
df_purchase_items.to_csv('purchase_items.csv', index=False)
df_product_batches.to_csv('product_batches.csv', index=False)
print("✅ Created purchases.csv, purchase_items.csv, & product_batches.csv")

print("\n🎉 Initial data generation complete!")
print("Run 'generate_sales.py' to simulate transactions.")