import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface PurchaseItem {
  _id: string;
  quantity: number;
  purchase_rate: number;
  tax_percent: number;
  discount_percent: number;
  batch_id: {
    _id: string;
    batch_number: string;
    barcode: string;
    expiry_date: string;
    mrp: number;
    product_id: {
      _id: string;
      product_name: string;
      category: string;
    };
  };
}

interface PurchaseDetails {
  purchase: {
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
      address: string;
      gst_number: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  items: PurchaseItem[];
}

const PurchaseDetailsView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      if (!id) {
        setError('Purchase ID not provided');
        setIsLoading(false);
        return;
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiBaseUrl}/api/purchases/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setPurchaseDetails(data);
        } else {
          setError('Purchase not found');
        }
      } catch (error) {
        console.error('Error fetching purchase details:', error);
        setError('Failed to fetch purchase details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [id]);

  const updatePaymentStatus = async (newStatus: string) => {
    if (!id) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchases/${id}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (response.ok) {
        setPurchaseDetails(prev => 
          prev ? {
            ...prev,
            purchase: {
              ...prev.purchase,
              payment_status: newStatus as 'Pending' | 'Paid' | 'Partial'
            }
          } : null
        );
      } else {
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></span>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const calculateItemTotal = (item: PurchaseItem) => {
    const baseAmount = item.quantity * item.purchase_rate;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const taxableAmount = baseAmount - discountAmount;
    const taxAmount = taxableAmount * (item.tax_percent / 100);
    return taxableAmount + taxAmount;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !purchaseDetails) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Not Found</h3>
            <p className="text-gray-500 mb-6">{error || 'The requested purchase could not be found.'}</p>
            <Button
              onClick={() => navigate('/purchases')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Purchase Management
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { purchase, items } = purchaseDetails;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Purchase #{purchase.bill_no}
              </h1>
              <p className="text-lg text-gray-600">Purchase order details and items</p>
            </div>
            <div className="text-right">
              {getStatusBadge(purchase.payment_status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Bill Number</label>
                <p className="text-lg font-semibold text-gray-900">{purchase.bill_no}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-lg text-gray-900">{formatDate(purchase.purchase_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(purchase.total_amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                <div className="flex items-center space-x-4 mt-2">
                  {getStatusBadge(purchase.payment_status)}
                  {purchase.payment_status !== 'Paid' && (
                    <select
                      value={purchase.payment_status}
                      onChange={(e) => updatePaymentStatus(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Pending">Mark as Pending</option>
                      <option value="Partial">Mark as Partial</option>
                      <option value="Paid">Mark as Paid</option>
                    </select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Vendor Name</label>
                <p className="text-lg font-semibold text-gray-900">{purchase.vendor_id.vendor_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg text-gray-900">{purchase.vendor_id.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg text-gray-900">{purchase.vendor_id.email}</p>
              </div>
              {purchase.vendor_id.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg text-gray-900">{purchase.vendor_id.address}</p>
                </div>
              )}
              {purchase.vendor_id.gst_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">GST Number</label>
                  <p className="text-lg text-gray-900">{purchase.vendor_id.gst_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Items */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.batch_id.product_id.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.batch_id.product_id.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.batch_id.batch_number}
                          </div>
                          {item.batch_id.barcode && (
                            <div className="text-sm text-gray-500">
                              {item.batch_id.barcode}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(item.purchase_rate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.discount_percent}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.tax_percent}%
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(calculateItemTotal(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Grand Total:
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="text-sm text-gray-900">{new Date(purchase.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">{new Date(purchase.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseDetailsView;