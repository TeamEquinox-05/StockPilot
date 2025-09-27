import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ForecastChart from '../components/ForecastChart';

interface ForecastData {
  date: string;
  predicted_sales: number;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unitPrice: number;
  lowStockThreshold: number;
}

interface Sale {
  _id: string;
  billNumber: string;
  totalAmount: number;
  items: any[];
  date: string;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  totalAmount: number;
  paymentStatus: string;
  date: string;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  date: string;
}

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalSales: number;
  totalPurchases: number;
  totalVendors: number;
  quantityInHand: number;
  quantityToBeReceived: number;
  recentSales: Sale[];
  recentPurchases: Purchase[];
  purchaseOrderStats: any;
}

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData[] | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
    fetchAllData();
  }, [navigate]);

  const fetchForecastData = async () => {
    try {
      setForecastLoading(true);
      setForecastError(null);
      
      const response = await fetch('http://localhost:5000/api/forecast');
      const result = await response.json();
      
      if (result.success) {
        setForecastData(result.data);
      } else {
        setForecastError(result.message || 'Failed to fetch forecast data');
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setForecastError('Failed to connect to forecast service');
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch all data in parallel
      const [
        productsResponse,
        salesResponse,
        purchasesResponse,
        purchaseOrdersResponse,
        vendorsResponse,
        purchaseStatsResponse,
        purchaseOrderStatsResponse
      ] = await Promise.all([
        fetch('http://localhost:5000/api/products', { headers }),
        fetch('http://localhost:5000/api/sales', { headers }),
        fetch('http://localhost:5000/api/purchases', { headers }),
        fetch('http://localhost:5000/api/purchase-orders', { headers }),
        fetch('http://localhost:5000/api/vendors', { headers }),
        fetch('http://localhost:5000/api/purchases/stats', { headers }),
        fetch('http://localhost:5000/api/purchase-orders/stats', { headers })
      ]);

      // Parse all responses
      const [
        productsData,
        salesData,
        purchasesData,
        purchaseOrdersData,
        vendorsData,
        purchaseStatsData,
        purchaseOrderStatsData
      ] = await Promise.all([
        productsResponse.json(),
        salesResponse.json(),
        purchasesResponse.json(),
        purchaseOrdersResponse.json(),
        vendorsResponse.json(),
        purchaseStatsResponse.json(),
        purchaseOrderStatsResponse.json()
      ]);

      // Calculate dashboard statistics
      const products = productsData || [];
      const sales = salesData || [];
      const purchases = purchasesData || [];
      const vendors = vendorsData || [];

      // Calculate low stock items
      const lowStockItems = products.filter((product: Product) => 
        product.stockQuantity <= (product.lowStockThreshold || 10)
      ).length;

      // Calculate total quantities
      const quantityInHand = products.reduce((sum: number, product: Product) => 
        sum + (product.stockQuantity || 0), 0
      );

      // Calculate quantity to be received from pending purchase orders
      const quantityToBeReceived = purchaseOrdersData?.filter((po: PurchaseOrder) => 
        po.status === 'pending' || po.status === 'confirmed'
      ).length || 0;

      // Get recent sales (last 5)
      const recentSales = sales.slice(-5).reverse();

      // Get recent purchases (last 5) 
      const recentPurchases = purchases.slice(-5).reverse();

      const stats: DashboardStats = {
        totalProducts: products.length,
        lowStockItems,
        totalSales: sales.length,
        totalPurchases: purchases.length,
        totalVendors: vendors.length,
        quantityInHand,
        quantityToBeReceived,
        recentSales,
        recentPurchases,
        purchaseOrderStats: purchaseOrderStatsData
      };

      setDashboardStats(stats);
      
      // Also fetch forecast data
      await fetchForecastData();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error: {error}</div>
          <button 
            onClick={fetchAllData}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
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

        {/* Overview Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{dashboardStats?.totalProducts || 0}</div>
                <div className="text-gray-500 text-sm mb-1">Items</div>
                <div className="text-gray-700 text-sm font-medium">TOTAL PRODUCTS</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{dashboardStats?.lowStockItems || 0}</div>
                <div className="text-gray-500 text-sm mb-1">Items</div>
                <div className="text-gray-700 text-sm font-medium">LOW STOCK ITEMS</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{dashboardStats?.totalSales || 0}</div>
                <div className="text-gray-500 text-sm mb-1">Orders</div>
                <div className="text-gray-700 text-sm font-medium">TOTAL SALES</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{dashboardStats?.totalVendors || 0}</div>
                <div className="text-gray-500 text-sm mb-1">Partners</div>
                <div className="text-gray-700 text-sm font-medium">TOTAL VENDORS</div>
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
                  <span className="text-red-600 font-bold">{dashboardStats?.lowStockItems || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Purchases</span>
                  <span className="text-gray-900 font-bold">{dashboardStats?.totalPurchases || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">All Items</span>
                  <span className="text-gray-900 font-bold">{dashboardStats?.totalProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Recent Sales</span>
                  <span className="text-green-600 font-bold">{dashboardStats?.recentSales?.length || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-900 font-bold text-lg">{(dashboardStats?.totalProducts || 0) - (dashboardStats?.lowStockItems || 0)}</div>
                    <div className="text-gray-600 text-sm">In Stock Items</div>
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
                <div className="text-gray-900 font-bold text-xl">{dashboardStats?.quantityInHand?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">QUANTITY TO BE RECEIVED</div>
                <div className="text-gray-900 font-bold text-xl">{dashboardStats?.quantityToBeReceived || 0}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">TOTAL VENDORS</div>
                <div className="text-gray-900 font-bold text-xl">{dashboardStats?.totalVendors || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Forecast Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Forecast</h3>
            {forecastLoading ? (
              <div className="flex items-center justify-center h-80">
                <div className="text-gray-500">Loading forecast data...</div>
              </div>
            ) : forecastError ? (
              <div className="flex items-center justify-center h-80">
                <div className="text-red-500">Error: {forecastError}</div>
                <button 
                  onClick={fetchForecastData}
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : forecastData ? (
              <ForecastChart data={forecastData} title="5-Day Sales Forecast" />
            ) : (
              <div className="flex items-center justify-center h-80">
                <div className="text-gray-500">No forecast data available</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Purchases */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Purchases</h3>
            <div className="space-y-3">
              {(dashboardStats?.recentPurchases?.length || 0) > 0 ? (
                dashboardStats?.recentPurchases.slice(0, 5).map((purchase: Purchase, index) => (
                  <div key={purchase._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">#{purchase.purchaseNumber}</div>
                      <div className="text-xs text-gray-500">{new Date(purchase.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">₹{purchase.totalAmount?.toLocaleString()}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 
                        purchase.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-red-100 text-red-600'
                      }`}>
                        {purchase.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No recent purchases</div>
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Sales</h3>
            <div className="space-y-3">
              {(dashboardStats?.recentSales?.length || 0) > 0 ? (
                dashboardStats?.recentSales.slice(0, 5).map((sale: Sale, index) => (
                  <div key={sale._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">#{sale.billNumber}</div>
                      <div className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">₹{sale.totalAmount?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{sale.items?.length || 0} items</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No recent sales</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;