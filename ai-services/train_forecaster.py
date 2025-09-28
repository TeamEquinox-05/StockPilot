import pandas as pd
from pymongo import MongoClient
from prophet import Prophet
import joblib
import warnings
import sys # Import sys to read command-line arguments

# Suppress harmless warnings from Prophet
warnings.simplefilter(action='ignore', category=FutureWarning)

# --- Check for a specific product ID from the command line ---
product_id_to_train = None
if len(sys.argv) > 1:
    product_id_to_train = sys.argv[1]
    print(f"Starting AI Model Training for SPECIFIC product: {product_id_to_train}")
else:
    print("Starting AI Model Training for ALL sales...")

# --- 1. CONNECT TO MONGODB AND GET SALES DATA ---
try:
    # IMPORTANT: Paste your connection string here
    CONNECTION_STRING = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"
    client = MongoClient(CONNECTION_STRING)
    db = client['stockpilot_db_v2'] # Connect to the new database
    
    # Fetch data from sales and sale_items collections
    sales_data = list(db.sales.find({}))
    sale_items_data = list(db.sale_items.find({}))
    df_sales = pd.DataFrame(sales_data)
    df_sale_items = pd.DataFrame(sale_items_data)
    
    client.close()
    
    if df_sales.empty or df_sale_items.empty:
        print("No sales or sale items data found in the database. Exiting.")
        exit()
        
    print(f"Successfully fetched {len(df_sales)} sales and {len(df_sale_items)} sale items from MongoDB.")

except Exception as e:
    print(f"Error connecting to or fetching from MongoDB: {e}")
    exit()

# --- 2. PREPARE THE DATA FOR FORECASTING ---
df_full_sales = pd.merge(df_sales, df_sale_items, on='sale_id')

# If a product ID was provided, filter the data for that product
if product_id_to_train:
    # We need to link sale_items to product_id via product_batches
    try:
        df_batches = pd.read_csv('product_batches.csv')
        df_items_with_products = pd.merge(df_sale_items, df_batches[['batch_id', 'product_id']], on='batch_id', how='left')
        
        # Now filter for the specific product
        product_sales_items = df_items_with_products[df_items_with_products['product_id'] == product_id_to_train]
        if product_sales_items.empty:
            print(f"No sales data found for product '{product_id_to_train}'. Exiting.")
            exit()
        
        # Filter the main sales data to only include sales of this product
        df_merged = pd.merge(df_sales, product_sales_items, on='sale_id')
    except FileNotFoundError:
        print("'product_batches.csv' not found. Cannot filter by product.")
        exit()
else:
    df_merged = df_full_sales


df_merged['sale_date'] = pd.to_datetime(df_merged['sale_date'])
daily_sales = df_merged.groupby(df_merged['sale_date'].dt.date)['quantity'].sum().reset_index()
daily_sales.columns = ['ds', 'y']
daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])

print("Data prepared for forecasting.")
print("Daily Sales Summary:")
print(daily_sales.tail())


# --- 3. TRAIN THE PROPHET FORECASTING MODEL ---
# Initialize the model. Prophet will automatically detect trends and weekly patterns.
model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
model.fit(daily_sales)

print("AI model has been successfully trained.")


# --- 4. SAVE THE TRAINED MODEL TO A FILE ---
# We save the model so we don't have to retrain it every time.
if product_id_to_train:
    model_filename = f'forecaster_{product_id_to_train}.joblib'
else:
    model_filename = 'sales_forecaster2.joblib'

joblib.dump(model, model_filename)

print(f"\nSuccess! The AI 'brain' has been saved as '{model_filename}'.")
print("This file contains all the learned patterns from your sales data.")
