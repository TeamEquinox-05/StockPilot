import subprocess
import sys
import os
import json

def test_product_forecaster(product_id):
    """
    Test the product_forecaster.py script directly
    """
    print(f"Testing product forecaster for product: {product_id}")
    
    # Get the path to the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(current_dir, "product_forecaster.py")
    
    # Get the path to the Python executable (use the one running this script)
    python_executable = sys.executable
    print(f"Running: {python_executable} {script_path} {product_id}")
    
    result = subprocess.run(
        [python_executable, script_path, product_id],
        capture_output=True,
        text=True,
        cwd=current_dir
    )
    
    # Print the result details
    print(f"Return code: {result.returncode}")
    if result.stderr:
        print(f"Error output: {result.stderr}")
    
    # Process the output
    if result.returncode == 0:
        try:
            # Try to parse the output as JSON
            # Get only the last line which should contain just the JSON
            json_output = result.stdout.strip()
            
            forecast_data = json.loads(json_output)
            print("Successfully parsed forecast data!")
            
            if isinstance(forecast_data, dict) and 'error' in forecast_data:
                print(f"ERROR in forecast: {forecast_data['error']}")
            elif isinstance(forecast_data, list):
                print(f"Forecast contains {len(forecast_data)} data points")
                if len(forecast_data) > 0:
                    print("First data point:")
                    print(json.dumps(forecast_data[0], indent=2))
                    print("Last data point:")
                    print(json.dumps(forecast_data[-1], indent=2))
            else:
                print(f"Unexpected forecast data format: {type(forecast_data)}")
                
            # Return the forecast data
            return forecast_data
            
        except json.JSONDecodeError as e:
            print(f"ERROR: Could not parse output as JSON: {e}")
            print("Raw output:")
            print(result.stdout)
    else:
        print(f"ERROR: Script failed with return code {result.returncode}")
        print("Stdout:")
        print(result.stdout)
    
    return None

if __name__ == "__main__":
    # Get product ID from command line or use a default
    product_id = sys.argv[1] if len(sys.argv) > 1 else "PROD_041"
    forecast = test_product_forecaster(product_id)
    
    if forecast:
        print(f"\nForecast summary:")
        print(f"- Time period: {forecast[0]['date']} to {forecast[-1]['date']}")
        print(f"- Average predicted sales: {sum(item['predicted_sales'] for item in forecast) / len(forecast):.1f}")
        print(f"- Maximum predicted sales: {max(item['predicted_sales'] for item in forecast)}")
        print(f"- Minimum predicted sales: {min(item['predicted_sales'] for item in forecast)}")