import sys
import json
from reorder_point_calculator import ReorderPointCalculator

def test_reorder_calculator(product_id=None):
    """Test the reorder point calculator"""
    calculator = ReorderPointCalculator()
    
    if product_id:
        # Calculate reorder point for specific product
        result = calculator.calculate_reorder_point(product_id)
        print(f"\nReorder Point Calculation for {product_id}:")
        print(json.dumps(result, indent=2))
    else:
        # Get top 5 products that need reordering
        all_results = calculator.calculate_all_reorder_points()
        
        # Count products that need reordering
        reorder_needed = [r for r in all_results if r['reorder_needed']]
        
        print(f"\nProducts needing reorder: {len(reorder_needed)} of {len(all_results)}")
        
        # Show top 5 products needing reorder
        print("\nTop 5 Products Needing Reorder:")
        for i, result in enumerate(reorder_needed[:5]):
            print(f"{i+1}. {result['product_id']} ({result['product_name']})")
            print(f"   Current inventory: {result['current_inventory']}")
            print(f"   Reorder point: {result['reorder_point']}")
            print(f"   Avg daily usage: {result['avg_daily_usage']}")
            print("")
        
        # Show 5 products not yet needing reorder, sorted by days_until_reorder
        not_needed = [r for r in all_results if not r['reorder_needed']]
        not_needed_sorted = sorted(not_needed, key=lambda x: x['days_until_reorder'])
        
        print("\nTop 5 Products Not Yet Needing Reorder:")
        for i, result in enumerate(not_needed_sorted[:5]):
            print(f"{i+1}. {result['product_id']} ({result['product_name']})")
            print(f"   Current inventory: {result['current_inventory']}")
            print(f"   Reorder point: {result['reorder_point']}")
            print(f"   Days until reorder needed: {result['days_until_reorder']}")
            print("")

if __name__ == "__main__":
    # If a product ID is provided as an argument, test for that product
    if len(sys.argv) > 1:
        test_reorder_calculator(sys.argv[1])
    else:
        test_reorder_calculator()