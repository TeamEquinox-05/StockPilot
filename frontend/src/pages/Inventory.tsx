import DashboardLayout from '../components/DashboardLayout';

const Inventory = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Inventory Management</h1>
          <p className="text-gray-600 text-lg mb-8">
            Manage your inventory items, track stock levels, and optimize your warehouse operations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">All Items</h3>
              <p className="text-gray-600">View and manage all inventory items</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Categories</h3>
              <p className="text-gray-600">Organize items by categories</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Stock Levels</h3>
              <p className="text-gray-600">Monitor stock levels and alerts</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;