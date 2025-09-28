import pandas as pd
from pymongo import MongoClient
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import matplotlib.pyplot as plt

print("🚀 Starting AI Model Evaluation...")

# --- 1. GET DATA ---
CONNECTION_STRING = (
    "mongodb+srv://teamequinox:teamequinox05@test.v9dxjxq.mongodb.net/"
    "?retryWrites=true&w=majority&appName=test"
)
client = MongoClient(CONNECTION_STRING)
db = client['stockpilot_db_v5'] # Connect to the new database

# Load sales and sale_items data
sales_data = list(db.sales.find({}))
sale_items_data = list(db.sale_items.find({}))
df_sales = pd.DataFrame(sales_data)
df_sale_items = pd.DataFrame(sale_items_data)
client.close()

if df_sales.empty or df_sale_items.empty:
    raise ValueError("❌ Sales or Sale Items data not found in the database.")

# Merge to get quantity per sale date
# In MongoDB schema, sale_id in sale_items refers to _id in sales
df_merged = pd.merge(df_sales, df_sale_items, left_on='_id', right_on='sale_id')

# --- 2. PREPARE DATA ---
df_merged['sale_date'] = pd.to_datetime(df_merged['sale_date'])
daily_sales = (
    df_merged.groupby(df_merged['sale_date'].dt.date)['quantity']
    .sum()
    .reset_index()
)
daily_sales.columns = ['ds', 'y']
daily_sales['ds'] = pd.to_datetime(daily_sales['ds'])

# --- 3. SPLIT DATA ---
if len(daily_sales) < 14:
    raise ValueError("❌ Not enough data to train/test (need at least 14 days).")

train_data = daily_sales.iloc[:-7]
test_data = daily_sales.iloc[-7:]
print(f"✅ Splitting data: {len(train_data)} days for training, {len(test_data)} days for testing.")

# --- 4. TRAIN MODEL ---
model = Prophet(
    daily_seasonality=False,
    weekly_seasonality=True,
    yearly_seasonality=False
)
model.fit(train_data)
print("✅ Model trained on historical data.")

# --- 5. MAKE PREDICTIONS ---
future = model.make_future_dataframe(periods=7)
forecast = model.predict(future)

# Only keep last 7 predictions
predictions = forecast.tail(7)

# --- 6. EVALUATE MODEL ---
actuals = test_data['y'].values
predicted = predictions['yhat'].values

mae = mean_absolute_error(actuals, predicted)
mape = mean_absolute_percentage_error(actuals, predicted)

print("\n--- Model Accuracy Report ---")
print(f"MAE (Mean Absolute Error): {mae:.2f}")
print(f"MAPE (Mean Absolute Percentage Error): {mape:.2%}")
print("-----------------------------")
print(
    f"Interpretation: On average, the model's forecast was off by about "
    f"{int(round(mae, 0))} units, or {mape:.2%}."
)

# --- 7. VISUALIZE ---
fig = model.plot(forecast)
plt.plot(test_data['ds'], test_data['y'], 'r.', label='Actual Sales')
plt.title('Sales Forecast vs Actuals')
plt.legend()
plt.show()

print("✅ AI model has been evaluated.")