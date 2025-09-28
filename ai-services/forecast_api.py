from flask import Flask, jsonify
from flask_cors import CORS
from prophet import Prophet
import joblib
import os       # To check for files and remove them
import sys      # To get the path to the current python executable
import subprocess # To run the training script
import json     # To parse JSON from subprocess output
import pandas as pd
import numpy as np
import matplotlib
import traceback
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

# Custom JSON encoder for NumPy types
class NumpyJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyJSONEncoder, self).default(obj)

# Initialize the Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for all routes
app.json.encoder = NumpyJSONEncoder  # Use custom encoder for NumPy types

# Import ReorderPointCalculator but don't initialize until needed
try:
    from reorder_point_calculator import ReorderPointCalculator, convert_to_serializable
    print("ReorderPointCalculator module imported successfully.")
except Exception as e:
    print(f"Error importing ReorderPointCalculator module: {str(e)}")
    traceback.print_exc()
    ReorderPointCalculator = None
    convert_to_serializable = None

# --- GENERAL FORECAST ENDPOINT ---
@app.route('/forecast', methods=['GET'])
def get_general_forecast():
    try:
        print("Loading the GENERAL forecasting model...")
        model = joblib.load('sales_forecaster2.joblib')
        print("General model loaded.")
        
        future = model.make_future_dataframe(periods=7)
        forecast = model.predict(future)
        
        result = forecast.rename(columns={'ds': 'date', 'yhat': 'predicted_sales'})
        result = result[['date', 'predicted_sales']].tail(7)
        result['date'] = result['date'].dt.strftime('%Y-%m-%d')
        result['predicted_sales'] = result['predicted_sales'].round().astype(int)
        
        # Create a figure to visualize the forecast
        plt.figure(figsize=(10, 6))
        plt.plot(pd.to_datetime(result['date']), result['predicted_sales'], label='Predicted Sales')
        plt.title('Global Sales Forecast for the Next 30 Days')
        plt.xlabel('Date')
        plt.ylabel('Predicted Sales')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.savefig('forecast_20250926.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        return jsonify(result.to_dict('records'))
    except FileNotFoundError:
        return jsonify({"error": "General forecast model (sales_forecaster2.joblib) not found."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UPGRADED: DYNAMIC PRODUCT FORECAST ENDPOINT ---
@app.route('/forecast/<string:product_id>', methods=['GET'])
def get_product_forecast(product_id):
    """
    Returns a 30-day forecast for a SPECIFIC product.
    Uses the new self-contained product_forecaster.py script.
    """
    try:
        # Get absolute path to the current script directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"Current directory: {current_dir}")
        
        # Build absolute paths to the python executable and the script
        # Use the same python executable that's running this API
        python_executable = sys.executable
        script_path = os.path.join(current_dir, "product_forecaster.py")
        
        print(f"Running: {python_executable} {script_path} {product_id}")
        
        # Run the product_forecaster.py script with the product ID
        result = subprocess.run(
            [python_executable, script_path, product_id], 
            capture_output=True,
            text=True,
            cwd=current_dir  # Run in the current directory
        )
        
        # Check if the process returned an error code
        if result.returncode != 0:
            print(f"Error running product_forecaster.py: {result.stderr}")
            if result.stdout:
                # Try to extract error from JSON if present
                try:
                    error_data = json.loads(result.stdout)
                    if isinstance(error_data, dict) and 'error' in error_data:
                        return jsonify({
                            "error": error_data['error']
                        }), 400
                except:
                    pass
                
            return jsonify({
                "error": f"Failed to generate forecast for product {product_id}",
                "details": result.stderr or "Unknown error"
            }), 500
        
        # Try to parse the output as JSON
        try:
            # Get the output from stdout (should be just JSON)
            json_output = result.stdout.strip()
            forecast_data = json.loads(json_output)
            
            # Check if there's an error message in the JSON
            if isinstance(forecast_data, dict) and 'error' in forecast_data:
                return jsonify({
                    "error": forecast_data['error']
                }), 400
                
            # Generate visualization if it's a valid forecast
            if isinstance(forecast_data, list) and len(forecast_data) > 0:
                # Create a dataframe from the forecast data
                forecast_df = pd.DataFrame(forecast_data)
                
                # Create a figure to visualize the forecast
                plt.figure(figsize=(10, 6))
                plt.plot(pd.to_datetime(forecast_df['date']), forecast_df['predicted_sales'], label='Predicted Sales')
                plt.title(f'Sales Forecast for Product {product_id} - Next 30 Days')
                plt.xlabel('Date')
                plt.ylabel('Predicted Sales')
                plt.legend()
                plt.grid(True, alpha=0.3)
                plt.savefig(f'components_{product_id}.png', dpi=300, bbox_inches='tight')
                plt.close()
            
            return jsonify({
                "product_id": product_id,
                "forecast": forecast_data
            })
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse output as JSON: {e}")
            print(f"Raw output: {result.stdout}")
            return jsonify({
                "error": "Failed to parse forecast data.",
                "details": f"JSON parsing error: {str(e)}"
            }), 500
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# --- REORDER POINT ENDPOINTS ---

@app.route('/reorder/<string:product_id>', methods=['GET'])
def get_product_reorder_point(product_id):
    """
    Calculate and return the reorder point for a specific product.
    """
    if ReorderPointCalculator is None:
        return jsonify({"error": "ReorderPointCalculator module is not available"}), 500
    
    try:
        # Create calculator on demand
        calculator = ReorderPointCalculator()
        result = calculator.calculate_reorder_point(product_id)
        
        if 'error' in result:
            return jsonify({"error": result['error']}), 400
        
        # Convert any NumPy types to Python types
        if convert_to_serializable:
            result = {k: convert_to_serializable(v) for k, v in result.items()}
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error calculating reorder point: {str(e)}")
        traceback.print_exc()  # Add traceback for more detailed error info
        return jsonify({"error": str(e)}), 500

@app.route('/reorder', methods=['GET'])
def get_all_reorder_points():
    """
    Calculate and return reorder points for all products.
    Products that need reordering will be at the top of the list.
    """
    if ReorderPointCalculator is None:
        return jsonify({"error": "ReorderPointCalculator module is not available"}), 500
        
    try:
        # Create calculator on demand
        calculator = ReorderPointCalculator()
        results = calculator.calculate_all_reorder_points()
        
        # Count products that need reordering
        reorder_needed_count = sum(1 for item in results if item['reorder_needed'])
        
        # Convert any NumPy types to Python types
        if convert_to_serializable and results:
            results = [{k: convert_to_serializable(v) for k, v in item.items()} for item in results]
        
        return jsonify({
            "reorder_summary": {
                "total_products": len(results),
                "products_needing_reorder": reorder_needed_count
            },
            "reorder_points": results
        })
        
    except Exception as e:
        print(f"Error calculating all reorder points: {str(e)}")
        traceback.print_exc()  # Add traceback for more detailed error info
        return jsonify({"error": str(e)}), 500

# Add a health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    print("Starting Flask server...")
    # Show the URL directly so it's visible even if there are other issues
    print("Flask app will be accessible at: http://127.0.0.1:5001")
    print(" * Running on http://0.0.0.0:5001")
    print(" * Debug mode: on")
    
    # Run the app with the reloader turned OFF to prevent it from
    # restarting during on-the-fly training.
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)