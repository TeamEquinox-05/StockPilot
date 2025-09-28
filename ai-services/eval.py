import pandas as pd
from pymongo import MongoClient
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import matplotlib.pyplot as plt
import joblib
import os
from datetime import datetime

print("🚀 Starting AI Model Evaluation...")

# --- 1. GET DATA ---
CONNECTION_STRING = (
    "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/"
    "?retryWrites=true&w=majority&appName=test"
)
client = MongoClient(CONNECTION_STRING)
db = client['stockpilot_db']

# Load sales data
sales_data = list(db.sales_transactions.find({}))
df_sales = pd.DataFrame(sales_data)
client.close()

# --- 2. PREPARE DATA ---
df_sales['timestamp'] = pd.to_datetime(df_sales['timestamp'])
daily_sales = (
    df_sales.groupby(df_sales['timestamp'].dt.date)['quantity_sold']
    .sum()
    .reset_index()
)
daily_sales.columns = ['ds', 'y']
daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])

# --- 3. SPLIT DATA ---
if len(daily_sales) < 14:
    raise ValueError("❌ Not enough data to train/test (need at least 14 days).")

# Use more data for training if available
if len(daily_sales) > 90:
    test_days = 14  # Use 2 weeks for testing with larger datasets
else:
    test_days = 7   # Standard 1 week for smaller datasets

train_data = daily_sales.iloc[:-test_days]
test_data = daily_sales.iloc[-test_days:]
print(f"✅ Splitting data: {len(train_data)} days for training, {len(test_data)} days for testing.")

# --- 4. TRAIN MODEL ---
model = Prophet(
    daily_seasonality=False,
    weekly_seasonality=True,
    yearly_seasonality=False,
    seasonality_mode='multiplicative'  # Better for sales data with growing trends
)

# Add holiday effects if you have Indian holidays
model.add_country_holidays(country_name='IN')

model.fit(train_data)
print("✅ Model trained on historical data.")

# Save the model for future use
model_path = 'sales_forecaster.joblib'
joblib.dump(model, model_path)
print(f"✅ Model saved to {model_path}")

# --- 5. MAKE PREDICTIONS ---
future = model.make_future_dataframe(periods=30)  # Extended to 30 days
forecast = model.predict(future)

# --- 6. EVALUATE MODEL ---
# Only evaluate on test period
test_predictions = forecast.iloc[-test_days:]
actuals = test_data['y'].values
predicted = test_predictions['yhat'].values

mae = mean_absolute_error(actuals, predicted)
mape = mean_absolute_percentage_error(actuals, predicted) * 100  # Convert to percentage

print("\n--- Model Accuracy Report ---")
print(f"MAE (Mean Absolute Error): {mae:.2f} units")
print(f"MAPE (Mean Absolute Percentage Error): {mape:.2f}%")
print("-----------------------------")
print(
    f"Interpretation: On average, the model's forecast was off by about "
    f"{int(round(mae, 0))} units, or {mape:.2f}%."
)

# Evaluate model quality
if mape < 10:
    print("✅ EXCELLENT: Model has high accuracy")
elif mape < 20:
    print("✅ GOOD: Model has acceptable accuracy")
else:
    print("⚠️ WARNING: Model accuracy needs improvement")

# --- 7. VISUALIZE ---
plt.figure(figsize=(12, 6))
fig = model.plot(forecast)
plt.plot(test_data['ds'], test_data['y'], 'ro', markersize=8, label='Actual Test Data')
plt.title('Sales Forecast vs Actuals')
plt.legend()
plt.grid(True, alpha=0.3)

# Save the figure
fig_path = f'forecast_{datetime.now().strftime("%Y%m%d")}.png'
plt.savefig(fig_path)
print(f"✅ Forecast visualization saved to {fig_path}")

plt.show()

# --- 8. COMPONENT ANALYSIS ---
fig2 = model.plot_components(forecast)
plt.tight_layout()
plt.savefig(f'components_{datetime.now().strftime("%Y%m%d")}.png')
print("✅ Trend and seasonality components saved")

print("\n🎯 Next steps:")
print("1. Use this model for inventory planning")
print("2. Schedule weekly retraining to improve accuracy")
print("3. Consider adding product-level forecasts for key items")