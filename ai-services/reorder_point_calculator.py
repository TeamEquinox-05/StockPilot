import pandas as pd
import numpy as np
import json
import sys
import logging
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Try importing MongoDB client - handle gracefully if not available
try:
    from pymongo import MongoClient
except ImportError:
    logging.error("PyMongo not installed. Please install with 'pip install pymongo'")
    MongoClient = None
    
# Helper function to convert NumPy types to Python types for JSON serialization
def convert_to_serializable(obj):
    """Convert NumPy types to Python types to make them JSON serializable"""
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d')
    else:
        return obj

# Configure logging to a file
logging.basicConfig(filename='reorder_calculator.log', level=logging.INFO)
logger = logging.getLogger("reorder_calculator")

class ReorderPointCalculator:
    def __init__(self, load_data_immediately=False):
        # MongoDB connection
        self.CONNECTION_STRING = "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/?retryWrites=true&w=majority&appName=test"
        
        # Constants for reorder calculation
        self.SAFETY_STOCK_FACTOR = 1.5  # Multiplier for safety stock
        self.LEAD_TIME_DAYS = 7  # Average lead time for restocking in days
        
        # Initialize data attributes
        self.df_sales = None
        self.df_sale_items = None
        self.df_batches = None
        self.df_products = None
        self.df_items_with_products = None
        
        # Only load data immediately if specified
        if load_data_immediately:
            self.load_data()
        
    def load_data(self):
        """Load data from MongoDB and CSV files"""
        try:
            logger.info("Connecting to MongoDB...")
            client = MongoClient(self.CONNECTION_STRING)
            db = client['stockpilot_db_v5']  # Updated database name for ObjectId support
            
            # Fetch data from MongoDB
            sales_data = list(db.sales.find({}))
            sale_items_data = list(db.sale_items.find({}))
            batches_data = list(db.product_batches.find({}))
            products_data = list(db.products.find({}))
            
            self.df_sales = pd.DataFrame(sales_data)
            self.df_sale_items = pd.DataFrame(sale_items_data)
            self.df_batches = pd.DataFrame(batches_data)
            self.df_products = pd.DataFrame(products_data)
            client.close()
            
            # Check if we got data from MongoDB
            if self.df_batches.empty or self.df_products.empty:
                logger.error("Failed to get data from MongoDB")
                return False
            
            # Join sale_items with batches to get product_id
            # When working with MongoDB ObjectIds, convert to strings for proper comparison
            self.df_sale_items['batch_id_str'] = self.df_sale_items['batch_id'].astype(str)
            self.df_batches['_id_str'] = self.df_batches['_id'].astype(str)
            
            self.df_items_with_products = pd.merge(
                self.df_sale_items, 
                self.df_batches[['_id_str', 'product_id']], 
                left_on='batch_id_str',
                right_on='_id_str', 
                how='left'
            )
            logger.info(f"Joined {len(self.df_items_with_products)} sale items with product info")
            
            logger.info("Data loaded successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            return False
    
    def calculate_reorder_point(self, product_id):
        """
        Calculate reorder point for a specific product
        
        Reorder Point = (Average Daily Usage * Lead Time) + Safety Stock
        Safety Stock = Average Daily Usage * Safety Stock Factor * sqrt(Lead Time)
        """
        try:
            # Make sure data is loaded
            if self.df_batches is None:
                success = self.load_data()
                if not success:
                    return {'error': "Failed to load data"}
                    
            # Get forecast for the product
            forecast = self.get_product_forecast(product_id)
            if not forecast or 'error' in forecast:
                return {'error': f"Failed to get forecast for product {product_id}"}
            
            # Get current inventory level
            current_inventory = self.get_current_inventory(product_id)
            
            # Calculate average daily usage based on forecast
            forecast_df = pd.DataFrame(forecast)
            avg_daily_usage = forecast_df['predicted_sales'].mean()
            
            # Calculate safety stock
            safety_stock = avg_daily_usage * self.SAFETY_STOCK_FACTOR * np.sqrt(self.LEAD_TIME_DAYS)
            
            # Calculate reorder point
            reorder_point = (avg_daily_usage * self.LEAD_TIME_DAYS) + safety_stock
            
            # Calculate days until reorder needed
            days_until_reorder = 0
            if avg_daily_usage > 0:
                days_until_reorder = max(0, (current_inventory - reorder_point) / avg_daily_usage)
            
            # Get product details - handle ObjectId
            if isinstance(product_id, ObjectId) or (isinstance(product_id, str) and ObjectId.is_valid(product_id)):
                product_id_obj = product_id if isinstance(product_id, ObjectId) else ObjectId(product_id)
                # First try direct comparison with ObjectId
                product_details = self.df_products[self.df_products['_id'] == product_id_obj]
                
                # If that fails, try string comparison
                if product_details.empty:
                    product_id_str = str(product_id_obj)
                    self.df_products['_id_str'] = self.df_products['_id'].astype(str)
                    product_details = self.df_products[self.df_products['_id_str'] == product_id_str]
            else:
                product_details = self.df_products[self.df_products['_id'] == product_id]
            
            product_name = product_details['product_name'].iloc[0] if not product_details.empty else "Unknown"
            
            # Determine if reorder is needed now
            reorder_needed = current_inventory <= reorder_point
            
            # Convert any NumPy types to regular Python types for JSON serialization
            result = {
                'product_id': str(product_id),
                'product_name': str(product_name),
                'current_inventory': int(current_inventory),
                'avg_daily_usage': float(round(avg_daily_usage, 2)),
                'reorder_point': int(round(reorder_point)),
                'safety_stock': int(round(safety_stock)),
                'reorder_needed': bool(reorder_needed),
                'days_until_reorder': float(round(days_until_reorder, 1)),
                'lead_time_days': int(self.LEAD_TIME_DAYS),
                'calculated_on': datetime.now().strftime('%Y-%m-%d')
            }
            
            logger.info(f"Calculated reorder point for {product_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating reorder point: {str(e)}")
            return {'error': str(e)}
    
    def get_product_forecast(self, product_id):
        """Get forecast for a specific product using the product_forecaster.py script"""
        try:
            import subprocess
            
            # Build paths to the python executable and the script
            python_executable = sys.executable
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "product_forecaster.py")
            
            # Run the product_forecaster.py script with the product ID
            result = subprocess.run(
                [python_executable, script_path, product_id], 
                capture_output=True,
                text=True
            )
            
            # Check if the process returned an error code
            if result.returncode != 0:
                logger.error(f"Error getting forecast: {result.stderr}")
                return None
                
            # Parse the output as JSON
            json_output = result.stdout.strip()
            forecast_data = json.loads(json_output)
            
            return forecast_data
            
        except Exception as e:
            logger.error(f"Error getting forecast: {str(e)}")
            return None
    
    def get_current_inventory(self, product_id):
        """Get current inventory for a specific product"""
        try:
            # Ensure product_id is ObjectId for comparison if it's a string
            if isinstance(product_id, str) and ObjectId.is_valid(product_id):
                product_id = ObjectId(product_id)
            
            # Filter batches for the specified product and sum the quantities
            # Check if we need to filter by _id (MongoDB ObjectId) or product_id (string)
            if 'product_id' in self.df_batches.columns:
                product_batches = self.df_batches[self.df_batches['product_id'] == product_id]
            else:
                logger.error("Column 'product_id' not found in batches data")
                return 0
                
            # Sum quantities, handling potential NaN values
            if 'quantity_in_stock' in product_batches.columns:
                current_inventory = product_batches['quantity_in_stock'].fillna(0).sum()
            else:
                logger.error("Column 'quantity_in_stock' not found in batches data")
                return 0
            
            return current_inventory
            
        except Exception as e:
            logger.error(f"Error getting inventory: {str(e)}")
            return 0
    
    def calculate_all_reorder_points(self):
        """Calculate reorder points for all products"""
        results = []
        
        # Make sure data is loaded
        if self.df_batches is None:
            success = self.load_data()
            if not success:
                return []
        
        # Get unique products with non-zero inventory
        product_ids = self.df_batches['product_id'].unique()
        
        for product_id in product_ids:
            result = self.calculate_reorder_point(product_id)
            if 'error' not in result:
                results.append(result)
        
        # Sort by reorder_needed (True first) then by days_until_reorder
        results = sorted(results, key=lambda x: (not x['reorder_needed'], x['days_until_reorder']))
        
        return results


if __name__ == "__main__":
    calculator = ReorderPointCalculator()
    
    # Check if a product ID was provided as an argument
    if len(sys.argv) > 1:
        product_id = sys.argv[1]
        result = calculator.calculate_reorder_point(product_id)
        print(json.dumps(result, indent=2))
    else:
        # Calculate for all products
        results = calculator.calculate_all_reorder_points()
        print(json.dumps(results, indent=2))