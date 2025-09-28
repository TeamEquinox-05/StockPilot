import pandas as pd
import numpy as np
from faker import Faker
import random
from datetime import datetime, timedelta
# Add bson module for MongoDB ObjectId
try:
    from bson import ObjectId
except ImportError:
    print("⚠️ bson module not found. Installing pymongo...")
    import subprocess
    subprocess.check_call(["pip", "install", "pymongo"])
    from bson import ObjectId

print("🚀 Starting Sales Simulation (v3) with MongoDB Schema...")

# Helper function to generate ObjectId
def generate_object_id():
    return str(ObjectId())

# Helper function to generate timestamps
def generate_timestamps():
    created = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]+'+00:00'
    return created, created

# --- 1. LOAD EXISTING DATA ---
try:
    df_batches = pd.read_csv('product_batches.csv')
    df_customers = pd.read_csv('customers.csv')
    print("✅ Loaded product batches and customers data.")
except FileNotFoundError as e:
    print(f"❌ Error: Make sure '{e.filename}' is in the same folder. Run 'generate_initial.py' first.")
    exit()

fake = Faker('en_IN')
sales_data = []
sale_items_data = []
NUMBER_OF_DAYS = 180 
base_sales_per_day = 20

# Add a random popularity score for simulation purposes
df_batches['popularity'] = [random.randint(1, 10) for _ in range(len(df_batches))]

# --- 2. SIMULATE SALES ---
sale_id_counter = 1
sale_item_id_counter = 1
for day in range(NUMBER_OF_DAYS):
    current_date = (pd.to_datetime('2025-09-26') - timedelta(days=180-day)).normalize()
    
    # Simple seasonality: more sales on weekends
    day_of_week_multiplier = 1.5 if current_date.weekday() >= 4 else 0.9
    num_sales_today = int(base_sales_per_day * day_of_week_multiplier * random.uniform(0.8, 1.2))

    for _ in range(num_sales_today):
        # Check if there is any stock left at all
        available_batches = df_batches[df_batches['quantity_in_stock'] > 0]
        if available_batches.empty:
            continue

        # Generate MongoDB ObjectId for this sale
        sale_id = generate_object_id()
        customer = df_customers.sample(1).iloc[0]
        customer_id = customer['_id'] if '_id' in customer else None
        sale_datetime = current_date + timedelta(hours=random.randint(9, 21), minutes=random.randint(0, 59))
        sale_created_at, sale_updated_at = generate_timestamps()
        
        num_items_in_sale = random.randint(1, 4)
        total_sale_amount = 0
        
        items_in_this_sale = []

        for _ in range(num_items_in_sale):
            available_batches = df_batches[df_batches['quantity_in_stock'] > 0]
            if available_batches.empty:
                break

            # Use popularity to influence which product is sold
            try:
                batch_to_sell = available_batches.sample(1, weights=available_batches['popularity'])
            except ValueError: # Happens if weights sum to 0
                batch_to_sell = available_batches.sample(1)

            batch_index = batch_to_sell.index[0]
            
            quantity_sold = 1 # Simple: sell 1 unit of each item
            mrp = df_batches.loc[batch_index, 'mrp']
            tax = random.choice([5, 12, 18])
            discount = random.choice([0, 5, 10]) if random.random() > 0.7 else 0
            
            # Calculate final price for this item
            item_total = (mrp * quantity_sold) * (1 + tax/100) * (1 - discount/100)
            total_sale_amount += item_total
            
            # Get batch_id (MongoDB ObjectId)
            # Handle both old and new schema
            if '_id' in df_batches.columns:
                batch_id = df_batches.loc[batch_index, '_id']
            else:
                # Fall back to batch_id if _id is not available
                batch_id = df_batches.loc[batch_index, 'batch_id']
                
            item_created_at, item_updated_at = generate_timestamps()
            
            # Add to sale_items with MongoDB schema
            items_in_this_sale.append({
                '_id': generate_object_id(),
                'sale_id': sale_id,
                'batch_id': batch_id,
                'quantity': quantity_sold,
                'mrp': mrp,
                'tax_percent': tax,
                'discount_percent': discount,
                'createdAt': item_created_at,
                'updatedAt': item_updated_at,
                '__v': 0
            })
            
            # Decrement stock
            df_batches.loc[batch_index, 'quantity_in_stock'] -= quantity_sold
            sale_item_id_counter += 1

        if not items_in_this_sale:
            continue

        # Add to sales with MongoDB schema
        sales_data.append({
            '_id': sale_id,
            'customer_id': customer_id,
            'sale_date': sale_datetime.strftime('%Y-%m-%dT%H:%M:%S.000+00:00'),
            'total_amount': round(total_sale_amount, 2),
            'payment_mode': random.choice(['UPI', 'CARD', 'CASH']),
            'createdAt': sale_created_at,
            'updatedAt': sale_updated_at,
            '__v': 0
        })
        
        sale_items_data.extend(items_in_this_sale)
        sale_id_counter += 1

    if available_batches.empty:
        print(f"⚠️ Ran out of all stock on day {day}. Stopping simulation.")
        break

# --- 3. CREATE AND SAVE DATAFRAMES ---
df_sales = pd.DataFrame(sales_data)
df_sale_items = pd.DataFrame(sale_items_data)

# Drop the temporary popularity column before saving
df_batches.drop(columns=['popularity'], inplace=True)

# Update timestamps for batches that had quantity changes
if 'updatedAt' in df_batches.columns:
    # Update only rows where quantity_in_stock changed (subtract from initial value)
    changed_indexes = df_batches['quantity_in_stock'] < df_batches['quantity_in_stock'].iloc[0]
    if any(changed_indexes):
        current_time = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]+'+00:00'
        df_batches.loc[changed_indexes, 'updatedAt'] = current_time

df_sales.to_csv('sales.csv', index=False)
df_sale_items.to_csv('sale_items.csv', index=False)
df_batches.to_csv('product_batches.csv', index=False)

print(f"\n✅ Successfully simulated {len(df_sales)} sales ({len(df_sale_items)} items) over {day+1} days.")
print("✅ Created sales.csv with MongoDB schema")
print("✅ Created sale_items.csv with MongoDB schema")
print("✅ Updated product_batches.csv")

print("\nSchema updated for MongoDB compatibility with ObjectIds and proper timestamps.")