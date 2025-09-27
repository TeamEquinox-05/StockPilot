import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FiFileText, FiBarChart, FiTrendingUp, FiPackage, FiUsers, FiDollarSign, FiCalendar, FiDownload, FiFilter } from 'react-icons/fi';

interface Report {
  id: string;
  title: string;
  description: string;
  category: 'stock' | 'sales' | 'financial' | 'vendor';
  icon: string;
  lastGenerated?: string;
  status: 'ready' | 'generating' | 'scheduled';
}

const Reports = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const categories = [
    { id: 'all', name: 'All Reports', count: 12 },
    { id: 'stock', name: 'Stock Reports', count: 4 },
    { id: 'sales', name: 'Sales Reports', count: 3 },
    { id: 'financial', name: 'Financial Reports', count: 3 },
    { id: 'vendor', name: 'Vendor Reports', count: 2 }
  ];

  const reports: Report[] = [
    // Stock Reports
    {
      id: 'stock-statement',
      title: 'Stock Statement',
      description: 'Current inventory levels, quantities on hand, and stock valuation',
      category: 'stock',
      icon: 'package',
      lastGenerated: '2 hours ago',
      status: 'ready'
    },
    {
      id: 'low-stock-alert',
      title: 'Low Stock Alert Report',
      description: 'Items running low on inventory with reorder recommendations',
      category: 'stock',
      icon: 'trending-up',
      lastGenerated: '1 day ago',
      status: 'ready'
    },
    {
      id: 'stock-movement',
      title: 'Stock Movement Report',
      description: 'Detailed view of stock transactions, receipts, and adjustments',
      category: 'stock',
      icon: 'bar-chart',
      lastGenerated: '3 hours ago',
      status: 'ready'
    },
    {
      id: 'dead-stock',
      title: 'Dead Stock Analysis',
      description: 'Items with no movement for extended periods',
      category: 'stock',
      icon: 'file-text',
      status: 'generating'
    },
    
    // Sales Reports
    {
      id: 'sales-summary',
      title: 'Sales Summary',
      description: 'Daily, weekly, and monthly sales performance overview',
      category: 'sales',
      icon: 'dollar-sign',
      lastGenerated: '1 hour ago',
      status: 'ready'
    },
    {
      id: 'top-selling-products',
      title: 'Top Selling Products',
      description: 'Best performing products by quantity and revenue',
      category: 'sales',
      icon: 'trending-up',
      lastGenerated: '4 hours ago',
      status: 'ready'
    },
    {
      id: 'customer-analysis',
      title: 'Customer Analysis',
      description: 'Customer buying patterns and performance metrics',
      category: 'sales',
      icon: 'users',
      lastGenerated: '6 hours ago',
      status: 'ready'
    },

    // Financial Reports
    {
      id: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Comprehensive P&L with revenue, costs, and margins',
      category: 'financial',
      icon: 'dollar-sign',
      lastGenerated: '1 day ago',
      status: 'ready'
    },
    {
      id: 'purchase-analysis',
      title: 'Purchase Analysis',
      description: 'Purchase orders, costs, and vendor performance',
      category: 'financial',
      icon: 'file-text',
      lastGenerated: '2 days ago',
      status: 'ready'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Report',
      description: 'Incoming and outgoing cash flow analysis',
      category: 'financial',
      icon: 'bar-chart',
      status: 'scheduled'
    },

    // Vendor Reports
    {
      id: 'vendor-performance',
      title: 'Vendor Performance',
      description: 'Vendor delivery times, quality metrics, and reliability',
      category: 'vendor',
      icon: 'users',
      lastGenerated: '3 days ago',
      status: 'ready'
    },
    {
      id: 'purchase-orders',
      title: 'Purchase Order Summary',
      description: 'Outstanding POs, delivery schedules, and vendor payments',
      category: 'vendor',
      icon: 'file-text',
      lastGenerated: '1 day ago',
      status: 'ready'
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ready: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
      generating: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Generating...' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getIcon = (iconName: string) => {
    const icons = {
      'package': <FiPackage className="w-6 h-6 text-gray-600" />,
      'trending-up': <FiTrendingUp className="w-6 h-6 text-gray-600" />,
      'bar-chart': <FiBarChart className="w-6 h-6 text-gray-600" />,
      'file-text': <FiFileText className="w-6 h-6 text-gray-600" />,
      'dollar-sign': <FiDollarSign className="w-6 h-6 text-gray-600" />,
      'users': <FiUsers className="w-6 h-6 text-gray-600" />
    };
    return icons[iconName as keyof typeof icons] || <FiFileText className="w-6 h-6 text-gray-600" />;
  };

  const handleGenerateReport = (reportId: string) => {
    alert(`Generating ${reports.find(r => r.id === reportId)?.title}...`);
  };

  const handleDownloadReport = (reportId: string) => {
    alert(`Downloading ${reports.find(r => r.id === reportId)?.title}...`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Generate and download comprehensive business reports</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search reports..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="From"
                  className="pl-10"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  placeholder="To"
                  className="pl-10"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <FiDownload className="w-4 h-4 mr-2" />
                Export All
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 flex-1">
                Generate Batch
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getIcon(report.icon)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {report.lastGenerated && (
                        <div className="text-xs text-gray-500">
                          Last generated: {report.lastGenerated}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGenerateReport(report.id)}
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                          disabled={report.status === 'generating'}
                        >
                          {report.status === 'generating' ? 'Generating...' : 'Generate'}
                        </Button>
                        {report.status === 'ready' && (
                          <Button
                            onClick={() => handleDownloadReport(report.id)}
                            variant="outline"
                            className="px-3"
                          >
                            <FiDownload className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">No reports found</div>
                <p className="text-gray-400">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;