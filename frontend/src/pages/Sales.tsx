import DashboardLayout from '../components/DashboardLayout';

const Sales = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sales Management</h1>
          <p className="text-gray-600 text-lg mb-8">
            Track sales orders, manage customers, and analyze sales performance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Orders</h3>
              <p className="text-gray-600">Manage sales orders and tracking</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customers</h3>
              <p className="text-gray-600">Customer management and profiles</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-sm transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics</h3>
              <p className="text-gray-600">Sales performance and insights</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Sales;