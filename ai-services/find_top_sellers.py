import pandas as pd

print("🚀 Analyzing sales data to find top sellers...")

try:
    # Load the sales and batch data
    df_items = pd.read_csv('sale_items.csv')
    df_batches = pd.read_csv('product_batches.csv')

    # Merge the two dataframes to link sales to products
    df_merged = pd.merge(df_items, df_batches[['batch_id', 'product_id']], on='batch_id', how='left')

    # Group by product_id and sum the quantity sold
    top_sellers = df_merged.groupby('product_id')['quantity'].sum().nlargest(5)

    print("\n--- 🏆 Top 5 Selling Products by Quantity ---")
    print(top_sellers)
    print("--------------------------------------------")
    print("\nNext Step: Use these Product IDs to train a specific forecast model for each one.")

except FileNotFoundError as e:
    print(f"❌ Error: '{e.filename}' not found. Please ensure you have run the data generation scripts.")
