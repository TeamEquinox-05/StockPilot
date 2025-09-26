import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

interface Purchase {
  _id: string;
  bill_no: string;
  purchase_date: string;
  total_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Partial';
  vendor_id: {
    _id: string;
    vendor_name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ViewPurchases = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch all purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/purchases`);
        
        if (response.ok) {
          const data = await response.json();
          setPurchases(data);
          setFilteredPurchases(data);
        } else {
          console.error('Failed to fetch purchases:', response.status);
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  // Filter and sort purchases
  useEffect(() => {
    let filtered = purchases.filter(purchase => {
      const matchesSearch = 
        purchase.bill_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.vendor_id.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || purchase.payment_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort purchases
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.purchase_date).getTime();
          bValue = new Date(b.purchase_date).getTime();
          break;
        case 'amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'vendor':
          aValue = a.vendor_id.vendor_name.toLowerCase();
          bValue = b.vendor_id.vendor_name.toLowerCase();
          break;
        case 'bill':
          aValue = a.bill_no.toLowerCase();
          bValue = b.bill_no.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPurchases(filtered);
  }, [purchases, searchTerm, statusFilter, sortBy, sortOrder]);

  // Update payment status
  const updatePaymentStatus = async (purchaseId: string, newStatus: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchases/${purchaseId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setPurchases(prevPurchases =>
          prevPurchases.map(purchase =>
            purchase._id === purchaseId
              ? { ...purchase, payment_status: newStatus as 'Pending' | 'Paid' | 'Partial' }
              : purchase
          )
        );
      } else {
        console.error('Failed to update payment status');
        alert('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
      'Paid': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
      'Partial': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-1.5`}></span>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate summary stats
  const summaryStats = {
    total: filteredPurchases.length,
    totalAmount: filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0),
    pending: filteredPurchases.filter(p => p.payment_status === 'Pending').length,
    paid: filteredPurchases.filter(p => p.payment_status === 'Paid').length,
    partial: filteredPurchases.filter(p => p.payment_status === 'Partial').length
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchases...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={() => navigate('/purchases')}
                className="mb-4 flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back to Purchase Management</span>
              </Button>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">All Purchases</h1>
              <p className="text-lg text-gray-600">Manage and track all your purchase orders</p>
            </div>
            <Button
              onClick={() => navigate('/purchases')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + New Purchase
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search by bill no. or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Purchase Date</option>
                  <option value="amount">Amount</option>
                  <option value="vendor">Vendor Name</option>
                  <option value="bill">Bill Number</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase List */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders ({filteredPurchases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases found</h3>
                <p className="text-gray-500 mb-6">
                  {purchases.length === 0 
                    ? "You haven't created any purchases yet." 
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                <Button
                  onClick={() => navigate('/purchases')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create First Purchase
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.bill_no}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {purchase._id.slice(-8)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {purchase.vendor_id.vendor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {purchase.vendor_id.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(purchase.purchase_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(purchase.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(purchase.payment_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {purchase.payment_status !== 'Paid' && (
                              <select
                                value={purchase.payment_status}
                                onChange={(e) => updatePaymentStatus(purchase._id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Partial">Partial</option>
                                <option value="Paid">Paid</option>
                              </select>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/purchases/${purchase._id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewPurchases;