import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome back to your inventory management system</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-gray-500 text-sm">Today</p>
                  <p className="text-gray-900 font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Activity Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">228</div>
                <div className="text-gray-500 text-sm mb-1">Qty</div>
                <div className="text-gray-700 text-sm font-medium">TO BE PACKED</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">6</div>
                <div className="text-gray-500 text-sm mb-1">Pkgs</div>
                <div className="text-gray-700 text-sm font-medium">TO BE SHIPPED</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">10</div>
                <div className="text-gray-500 text-sm mb-1">Pkgs</div>
                <div className="text-gray-700 text-sm font-medium">TO BE DELIVERED</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">474</div>
                <div className="text-gray-500 text-sm mb-1">Qty</div>
                <div className="text-gray-700 text-sm font-medium">TO BE INVOICED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Product Details Section */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-red-600">Low Stock Items</span>
                  <span className="text-red-600 font-bold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">All Item Group</span>
                  <span className="text-gray-900 font-bold">39</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">All Items</span>
                  <span className="text-gray-900 font-bold">190</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-600">Unconfirmed Items</span>
                  <span className="text-orange-600 font-bold">121</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-900 font-bold text-lg">174</div>
                    <div className="text-gray-600 text-sm">Active Items</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-500 text-sm mb-1">QUANTITY IN HAND</div>
                <div className="text-gray-900 font-bold text-xl">10,458</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">QUANTITY TO BE RECEIVED</div>
                <div className="text-gray-900 font-bold text-xl">168</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Purchase Order */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Purchase Order</h3>
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-2">Quantity Ordered</div>
              <div className="text-4xl font-bold text-blue-600">652.00</div>
            </div>
          </div>

          {/* Sales Order */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Order</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left pb-2">Channel</th>
                    <th className="text-left pb-2">Draft</th>
                    <th className="text-left pb-2">Confirmed</th>
                    <th className="text-left pb-2">Packed</th>
                    <th className="text-left pb-2">Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-gray-900">
                    <td className="py-2">Direct sales</td>
                    <td>0</td>
                    <td>50</td>
                    <td>0</td>
                    <td>0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;