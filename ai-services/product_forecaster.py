import pandas as pd
from pymongo import MongoClient
from prophet import Prophet
import json
import sys
import warnings
import logging
from bson import ObjectId

# Suppress warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# Configure logging to a file instead of stdout
logging.basicConfig(filename='product_forecaster.log', level=logging.INFO)
logger = logging.getLogger("product_forecaster")

# Check for a product ID parameter
if len(sys.argv) < 2:
    print(json.dumps({"error": "No product ID provided"}))
    exit(1)

product_id = sys.argv[1]
# Convert product_id to ObjectId if it's a valid string representation
if isinstance(product_id, str) and ObjectId.is_valid(product_id):
    product_id = ObjectId(product_id)
logger.info(f"Starting on-demand forecast for product: {product_id}")

try:
    # Connect to MongoDB
    CONNECTION_STRING = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"
    client = MongoClient(CONNECTION_STRING)
    db = client['stockpilot_db_v5']  # Updated database name for ObjectId support
    
    # Fetch data
    logger.info("Fetching sales data...")
    sales_data = list(db.sales.find({}))
    sale_items_data = list(db.sale_items.find({}))
    df_sales = pd.DataFrame(sales_data)
    df_sale_items = pd.DataFrame(sale_items_data)
    
    # Check if we have data
    if df_sales.empty or df_sale_items.empty:
        print(json.dumps({"error": "No sales data found in database"}))
        exit(1)
    
    logger.info("Loading product batches from MongoDB...")
    # Load product batches from MongoDB instead of CSV
    try:
        batches_data = list(db.product_batches.find({}))
        df_batches = pd.DataFrame(batches_data)
        if df_batches.empty:
            print(json.dumps({"error": "No product batches found in database"}))
            exit(1)
        logger.info(f"Successfully loaded {len(df_batches)} product batches")
    except Exception as batch_error:
        logger.error(f"Error loading product batches: {str(batch_error)}")
        print(json.dumps({"error": f"Error loading product batches: {str(batch_error)}"}))
        exit(1)
    
    logger.info("Joining data to link products...")
    # Join to link sale_items to products
    # When working with MongoDB ObjectIds, we need to convert the ids to strings for comparison
    if '_id' in df_batches.columns and 'batch_id' in df_sale_items.columns:
        # Convert ObjectId to string for proper comparison
        df_batches['batch_id_str'] = df_batches['_id'].astype(str)
        df_sale_items['batch_id_str'] = df_sale_items['batch_id'].astype(str)
        df_items_with_products = pd.merge(df_sale_items, df_batches[['batch_id_str', 'product_id']], 
                                        left_on='batch_id_str', right_on='batch_id_str', how='left')
    else:
        logger.error("Required columns not found in dataframes")
        print(json.dumps({"error": "Required columns not found in dataframes"}))
        exit(1)
    
    # Filter for the specific product - convert to string for comparison if needed
    if isinstance(product_id, ObjectId):
        product_id_str = str(product_id)
        df_items_with_products['product_id_str'] = df_items_with_products['product_id'].astype(str)
        product_sales_items = df_items_with_products[df_items_with_products['product_id_str'] == product_id_str]
    else:
        product_sales_items = df_items_with_products[df_items_with_products['product_id'] == product_id]
        
    # Log diagnostic information
    logger.info(f"Total sale items: {len(df_sale_items)}")
    logger.info(f"Total batches: {len(df_batches)}")
    logger.info(f"Items with products after join: {len(df_items_with_products)}")
    logger.info(f"Items for product {product_id}: {len(product_sales_items)}")
    
    if product_sales_items.empty:
        print(json.dumps({"error": f"No sales data found for product '{product_id}'"}))
        exit(1)
    
    # Create the merged dataset - handle ObjectId in sale_id
    if 'sale_id' in product_sales_items.columns and '_id' in df_sales.columns:
        # Convert to string for comparison
        product_sales_items['sale_id_str'] = product_sales_items['sale_id'].astype(str)
        df_sales['sale_id_str'] = df_sales['_id'].astype(str)
        df_merged = pd.merge(df_sales, product_sales_items, left_on='sale_id_str', right_on='sale_id_str')
    else:
        print(json.dumps({"error": "Required ID columns not found for merging sales data"}))
        exit(1)
        
    # Convert sale_date to datetime
    df_merged['sale_date'] = pd.to_datetime(df_merged['sale_date'])
    
    # Aggregate to daily totals
    daily_sales = df_merged.groupby(df_merged['sale_date'].dt.date)['quantity'].sum().reset_index()
    daily_sales.columns = ['ds', 'y']
    daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])
    
    logger.info("Training model...")
    # Train model
    model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(daily_sales)
    
    logger.info("Generating forecast...")
    # Generate forecast
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)
    
    # Format the output
    result = forecast[['ds', 'yhat']].tail(30)
    result = result.rename(columns={'ds': 'date', 'yhat': 'predicted_sales'})
    result['date'] = result['date'].dt.strftime('%Y-%m-%d')
    result['predicted_sales'] = result['predicted_sales'].round().astype(int)
    
    # Output ONLY the JSON with no other text to stdout
    print(json.dumps(result.to_dict('records')))
    client.close()
    
except Exception as e:
    logger.error(f"Error generating forecast: {str(e)}")
    print(json.dumps({"error": str(e)}))
    exit(1)