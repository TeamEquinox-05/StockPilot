import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FiMail, FiCreditCard, FiMessageCircle, FiSearch } from 'react-icons/fi';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'connected' | 'available' | 'coming-soon';
  isPopular?: boolean;
  setupUrl?: string;
  features: string[];
}

const Integrations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  const categories = [
    { id: 'all', name: 'All Services', count: 0 },
    { id: 'payment', name: 'Payment Gateways', count: 0 },
    { id: 'communication', name: 'Communication', count: 0 }
  ];

  const initialIntegrations: Integration[] = [
    // Email Service
    {
      id: 'email-service',
      name: 'Email Service',
      category: 'communication',
      description: 'Send automated emails for order confirmations, notifications, and marketing',
      icon: 'mail',
      status: 'available',
      isPopular: true,
      features: ['Order Confirmations', 'Automated Notifications', 'Marketing Campaigns', 'Template Management', 'Analytics Dashboard']
    },
    // Payment Gateway
    {
      id: 'razorpay',
      name: 'Razorpay',
      category: 'payment',
      description: 'Accept payments online with India\'s most trusted payment gateway',
      icon: 'credit-card',
      status: 'available',
      isPopular: true,
      features: ['UPI Payments', 'Credit/Debit Cards', 'Net Banking', 'Digital Wallets', 'EMI Options']
    },
    // WhatsApp Business
    {
      id: 'whatsapp-business',
      name: 'WhatsApp Business',
      category: 'communication',
      description: 'Send automated messages and updates to customers via WhatsApp',
      icon: 'message-circle',
      status: 'connected',
      isPopular: true,
      features: ['Automated Messages', 'Order Updates', 'Customer Support', 'Broadcast Lists', 'Media Sharing']
    }
  ];

  useEffect(() => {
    setIntegrations(initialIntegrations);
  }, []);

  // Toggle integration status
  const toggleIntegrationStatus = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          status: integration.status === 'connected' ? 'available' : 'connected'
        };
      }
      return integration;
    }));
  };

  // Filter integrations based on search and category
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">Connected</span>;
      case 'available':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">Available</span>;
      case 'coming-soon':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Coming Soon</span>;
      default:
        return null;
    }
  };

  // Handle integration action
  const handleIntegrationAction = (integration: Integration) => {
    if (integration.status === 'connected') {
      if (confirm(`Disconnect ${integration.name}?`)) {
        toggleIntegrationStatus(integration.id);
        alert(`${integration.name} has been disconnected.`);
      }
    } else if (integration.status === 'available') {
      toggleIntegrationStatus(integration.id);
      alert(`${integration.name} has been connected successfully!`);
    } else {
      alert(`${integration.name} is coming soon! We'll notify you when it's available.`);
    }
  };

  // Update category counts
  const updatedCategories = categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? filteredIntegrations.length 
      : filteredIntegrations.filter(i => i.category === category.id).length
  }));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <div className="text-lg font-semibold">
            {filteredIntegrations.length} Services Available
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {updatedCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 flex justify-between items-center ${
                      selectedCategory === category.id
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search integrations..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {integration.icon === 'mail' && <FiMail className="w-6 h-6 text-gray-600" />}
                          {integration.icon === 'credit-card' && <FiCreditCard className="w-6 h-6 text-gray-600" />}
                          {integration.icon === 'message-circle' && <FiMessageCircle className="w-6 h-6 text-gray-600" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {integration.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                          {integration.features.length > 3 && (
                            <li className="text-gray-500 text-xs">
                              +{integration.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                      <Button
                        onClick={() => handleIntegrationAction(integration)}
                        className={`w-full ${
                          integration.status === 'connected'
                            ? 'bg-red-600 hover:bg-red-700'
                            : integration.status === 'available'
                            ? 'bg-gray-900 hover:bg-gray-800'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={integration.status === 'coming-soon'}
                      >
                        {integration.status === 'connected' ? 'Disconnect' : 
                         integration.status === 'available' ? 'Connect' : 'Coming Soon'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No integrations found</div>
                <p className="text-gray-400">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Integrations;