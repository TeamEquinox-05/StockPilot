import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{import.meta.env.VITE_APP_NAME || 'StockPilot'}</span>
          </div>
          <Button onClick={handleGetStarted} variant="outline">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Intelligent Inventory
              <span className="text-blue-600 block">Management</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Optimize your inventory with AI-powered demand forecasting, automated stock alerts, 
              and real-time analytics. Perfect for small businesses looking to eliminate stockouts 
              and reduce carrying costs.
            </p>
            <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-6">
              Get Started
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  AI-powered demand forecasting and trend analysis to predict future inventory needs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <CardTitle>Real-time Alerts</CardTitle>
                <CardDescription>
                  Automated notifications for low stock, reorder points, and critical inventory levels
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle>Optimization Engine</CardTitle>
                <CardDescription>
                  Dynamic programming algorithms to optimize stock levels across multiple constraints
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <CardTitle>Seasonal Insights</CardTitle>
                <CardDescription>
                  Identify seasonal patterns and trends to prepare for demand fluctuations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>
                  Minimize carrying costs while avoiding stockouts through intelligent recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle>Supplier Integration</CardTitle>
                <CardDescription>
                  Seamless integration with supplier systems for automated reordering and tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Inventory Management?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses that have optimized their inventory operations with StockPilot's 
              intelligent system. Reduce costs, prevent stockouts, and boost profitability.
            </p>
            <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-6">
              Start Your Journey
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 mt-16">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2025 StockPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;