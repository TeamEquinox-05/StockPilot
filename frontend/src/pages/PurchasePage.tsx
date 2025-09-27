import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  FiShoppingCart, 
  FiClipboard, 
  FiFileText, 
  FiPackage, 
  FiCheckCircle, 
  FiClock, 
  FiBarChart, 
  FiEye, 
  FiHome, 
  FiCreditCard,
  FiTrendingUp,
  FiDollarSign 
} from 'react-icons/fi';

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  timeAgo: string;
  amount: number;
  vendor: string;
  payment_status: string;
}

interface PurchaseStats {
  thisMonthAmount: number;
  thisMonthCount: number;
  avgPurchaseAmount: number;
  completedOrders: number;
  pendingOrders: number;
  pendingAmount: number;
  totalOrders: number;
}

const PurchasePage = () => {
  const navigate = useNavigate();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStats>({
    thisMonthAmount: 0,
    thisMonthCount: 0,
    avgPurchaseAmount: 0,
    completedOrders: 0,
    pendingOrders: 0,
    pendingAmount: 0,
    totalOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const purchaseOptions = [
    {
      title: "Add Purchase",
      description: "Record a new purchase from vendors and update inventory",
      icon: FiShoppingCart,
      path: "/purchases/add",
      color: "bg-gray-50 border-gray-200 hover:bg-gray-100",
      buttonColor: "bg-gray-900 hover:bg-gray-800"
    },
    {
      title: "Create Purchase Order", 
      description: "Generate purchase orders to send to vendors",
      icon: FiClipboard,
      path: "/purchases/create-order",
      color: "bg-gray-50 border-gray-200 hover:bg-gray-100",
      buttonColor: "bg-gray-900 hover:bg-gray-800"
    },
    {
      title: "View Purchase Orders",
      description: "View, manage and download all purchase orders",
      icon: FiFileText,
      path: "/purchases/orders",
      color: "bg-gray-50 border-gray-200 hover:bg-gray-100", 
      buttonColor: "bg-gray-900 hover:bg-gray-800"
    }
  ];

  // Fetch recent purchase activities and stats
  useEffect(() => {
    const fetchData = async () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      try {
        // Fetch recent activities
        const activitiesResponse = await fetch(`${apiBaseUrl}/api/purchases/recent-activity?limit=5`);
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setRecentActivities(activitiesData.activities || []);
        } else {
          console.error('Failed to fetch recent activities:', activitiesResponse.status);
          setRecentActivities([]); // Set empty array on error
        }

        // Fetch purchase stats
        const statsResponse = await fetch(`${apiBaseUrl}/api/purchases/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setPurchaseStats(statsData.stats || {
            thisMonthAmount: 0,
            thisMonthCount: 0,
            avgPurchaseAmount: 0,
            completedOrders: 0,
            pendingOrders: 0,
            pendingAmount: 0,
            totalOrders: 0
          });
        } else {
          console.error('Failed to fetch purchase stats:', statsResponse.status);
          // Keep default values on error
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setRecentActivities([]); // Set empty array on network error
      } finally {
        setIsLoading(false);
        setIsStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOptionClick = (path: string) => {
    navigate(path);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Purchase Management</h1>
          <p className="text-lg text-gray-600">Choose an option to manage your inventory purchases and vendor relationships</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FiPackage className="text-2xl text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    {isStatsLoading ? (
                      <p className="text-2xl font-bold text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{purchaseStats.thisMonthAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {purchaseStats.thisMonthCount} purchase{purchaseStats.thisMonthCount !== 1 ? 's' : ''}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FiCheckCircle className="text-2xl text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                    {isStatsLoading ? (
                      <p className="text-2xl font-bold text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">{purchaseStats.completedOrders}</p>
                        <p className="text-xs text-gray-600 mt-1">Payments received</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FiClock className="text-2xl text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                    {isStatsLoading ? (
                      <p className="text-2xl font-bold text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">{purchaseStats.pendingOrders}</p>
                        <p className="text-xs text-gray-600 mt-1">Awaiting payment</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FiBarChart className="text-2xl text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    {isStatsLoading ? (
                      <p className="text-2xl font-bold text-gray-500">Loading...</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {purchaseStats.totalOrders}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">All time</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Insights */}
        {!isStatsLoading && (purchaseStats.pendingAmount > 0 || purchaseStats.avgPurchaseAmount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {purchaseStats.pendingAmount > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Outstanding Amount</h3>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        ₹{purchaseStats.pendingAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        From {purchaseStats.pendingOrders} pending order{purchaseStats.pendingOrders !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FiDollarSign className="text-3xl text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {purchaseStats.avgPurchaseAmount > 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Order Value</h3>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        ₹{Math.round(purchaseStats.avgPurchaseAmount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        This month's average
                      </p>
                    </div>
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FiTrendingUp className="text-3xl text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {purchaseOptions.map((option, index) => (
            <Card 
              key={index} 
              className={`${option.color} transition-all duration-200 cursor-pointer transform hover:scale-105 shadow-lg`}
              onClick={() => handleOptionClick(option.path)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-white rounded-full shadow-md">
                    <option.icon className="text-4xl text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {option.title}
                    </CardTitle>
                    <p className="text-gray-600 text-base leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className={`w-full ${option.buttonColor} text-white font-semibold py-3 px-6 text-lg rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(option.path);
                  }}
                >
                  Get Started →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiEye className="text-2xl text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Purchases</h3>
              <p className="text-sm text-gray-600 mb-4">Browse purchase history and reports</p>
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/purchases/list')}
              >
                View All
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiHome className="text-2xl text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendors</h3>
              <p className="text-sm text-gray-600 mb-4">Manage vendor relationships</p>
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/vendors')}
              >
                Manage
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiCreditCard className="text-2xl text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payments</h3>
              <p className="text-sm text-gray-600 mb-4">Track pending payments</p>
              <Button 
                variant="outline" 
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/purchases/payments')}
              >
                View Pending
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Purchase Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading recent activities...</div>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <FiPackage className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{activity.timeAgo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <FiPackage className="text-4xl mb-2 text-gray-400 mx-auto" />
                    <p className="text-gray-500 mb-2">No recent purchase activity</p>
                    <p className="text-sm text-gray-400 mb-4">Purchase activity will appear here once you start making purchases</p>
                    <Button
                      onClick={() => navigate('/purchases')}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      Create First Purchase
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PurchasePage;
