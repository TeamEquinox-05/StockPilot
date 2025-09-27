import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
impo            <div className="text-center py-12">
            <FiX className="text-6xl mb-4 text-gray-400 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Not Found</h2>jsPDF from 'jspdf';
import { FiArrowLeft, FiDownload, FiX } from 'react-icons/fi';

interface PurchaseOrderItem {
  productName: string;
  description: string;
  quantity: number;
  estimatedRate: number;
  amount: number;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  vendor_id: {
    _id: string;
    vendor_name: string;
    phone: string;
    email: string;
    address: string;
    gst_number: string;
    payment_terms: string;
  };
  orderDate: string;
  expectedDelivery: string;
  priority: string;
  status: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

const PurchaseOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrder(data);
      } else {
        setError('Purchase order not found');
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      setError('Error fetching purchase order details');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPurchaseOrder = () => {
    if (!purchaseOrder) return;
    generatePurchaseOrderPDF(purchaseOrder);
  };

  const generatePurchaseOrderPDF = (order: PurchaseOrder) => {
    const doc = new jsPDF();
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN');
    const expectedDelivery = new Date(order.expectedDelivery).toLocaleDateString('en-IN');
    const createdDate = new Date().toLocaleDateString('en-IN');
    
    let yPosition = 20;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 6;
    
    // Helper function to add text and move to next line
    const addLine = (text: string, fontSize = 10, style = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      doc.text(text, leftMargin, yPosition);
      yPosition += lineHeight;
    };
    
    // Helper function to add centered text
    const addCenteredLine = (text: string, fontSize = 10, style = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (210 - textWidth) / 2, yPosition);
      yPosition += lineHeight;
    };
    
    // Header
    addCenteredLine('PURCHASE ORDER', 20, 'bold');
    yPosition += 5;
    
    // Order Information
    addLine(`Order Number: ${order.orderNumber}`, 12, 'bold');
    addLine(`Order Date: ${orderDate}`);
    addLine(`Status: ${order.status}`);
    addLine(`Priority: ${order.priority}`);
    yPosition += 5;
    
    // Vendor Information
    addLine('VENDOR INFORMATION', 14, 'bold');
    addLine(`Name: ${order.vendor_id.vendor_name}`);
    addLine(`Phone: ${order.vendor_id.phone}`);
    addLine(`Email: ${order.vendor_id.email}`);
    addLine(`Address: ${order.vendor_id.address}`);
    if (order.vendor_id.gst_number) {
      addLine(`GST Number: ${order.vendor_id.gst_number}`);
    }
    if (order.vendor_id.payment_terms) {
      addLine(`Payment Terms: ${order.vendor_id.payment_terms}`);
    }
    yPosition += 5;
    
    // Order Details
    addLine('ORDER DETAILS', 14, 'bold');
    addLine(`Expected Delivery: ${expectedDelivery}`);
    yPosition += 5;
    
    // Items Header
    addLine('ITEMS', 14, 'bold');
    yPosition += 2;
    
    // Table Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', leftMargin, yPosition);
    doc.text('Qty', 90, yPosition);
    doc.text('Rate', 110, yPosition);
    doc.text('Amount', 150, yPosition);
    yPosition += lineHeight;
    
    // Draw line under header
    doc.line(leftMargin, yPosition - 2, rightMargin, yPosition - 2);
    yPosition += 2;
    
    // Items
    doc.setFont('helvetica', 'normal');
    order.items.forEach((item, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${index + 1}. ${item.productName}`, leftMargin, yPosition);
      doc.text(`${item.quantity}`, 90, yPosition);
      doc.text(`₹${item.estimatedRate.toLocaleString('en-IN')}`, 110, yPosition);
      doc.text(`₹${item.amount.toLocaleString('en-IN')}`, 150, yPosition);
      yPosition += lineHeight;
      
      if (item.description) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`   ${item.description}`, leftMargin, yPosition);
        yPosition += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }
    });
    
    yPosition += 5;
    
    // Total Line
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 5;
    
    // Total Amount
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 110, yPosition);
    doc.text(`₹${order.totalAmount.toLocaleString('en-IN')}`, 150, yPosition);
    yPosition += 10;
    
    // Terms & Conditions
    if (order.terms) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(order.terms, rightMargin - leftMargin);
      doc.text(termsLines, leftMargin, yPosition);
      yPosition += termsLines.length * lineHeight + 5;
    }
    
    // Notes
    if (order.notes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', leftMargin, yPosition);
      yPosition += lineHeight;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(order.notes, rightMargin - leftMargin);
      doc.text(notesLines, leftMargin, yPosition);
      yPosition += notesLines.length * lineHeight + 5;
    }
    
    // Footer
    yPosition = 280;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    addCenteredLine(`Generated on: ${createdDate}`);
    
    // Save the PDF
    doc.save(`${order.orderNumber}.pdf`);
  };

  const updateStatus = async (newStatus: string) => {
    if (!purchaseOrder) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders/${purchaseOrder._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setPurchaseOrder(prev => prev ? { ...prev, status: newStatus } : null);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Draft': { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
      'Sent': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
      'Confirmed': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
      'Partially_Received': { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
      'Received': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></span>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'Low': { bg: 'bg-gray-100', text: 'text-gray-600' },
      'Normal': { bg: 'bg-blue-100', text: 'text-blue-600' },
      'High': { bg: 'bg-orange-100', text: 'text-orange-600' },
      'Urgent': { bg: 'bg-red-100', text: 'text-red-600' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.Normal;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${config.bg} ${config.text}`}>
        {priority}
      </span>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase order details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The purchase order you are looking for does not exist.'}</p>
            <Button onClick={() => navigate('/purchases/orders')} className="bg-blue-600 hover:bg-blue-700">
              Back to Purchase Orders
            </Button>
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
          <Button
            variant="outline"
            onClick={() => navigate('/purchases/orders')}
            className="mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Purchase Orders</span>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchase Order Details</h1>
              <p className="text-lg text-gray-600">{purchaseOrder.orderNumber}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={downloadPurchaseOrder}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                📄 Download PDF
              </Button>
              {purchaseOrder.status !== 'Received' && purchaseOrder.status !== 'Cancelled' && (
                <select
                  value={purchaseOrder.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Partially_Received">Partially Received</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Order Information
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(purchaseOrder.status)}
                    {getPriorityBadge(purchaseOrder.priority)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Number</label>
                    <p className="text-lg font-semibold text-gray-900">{purchaseOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Date</label>
                    <p className="text-lg text-gray-900">
                      {new Date(purchaseOrder.orderDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Delivery</label>
                    <p className="text-lg text-gray-900">
                      {new Date(purchaseOrder.expectedDelivery).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-lg text-gray-900">
                      {new Date(purchaseOrder.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({purchaseOrder.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchaseOrder.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="text-lg font-semibold">{item.quantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Rate</p>
                          <p className="text-lg font-semibold">₹{item.estimatedRate.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Item Total:</span>
                          <span className="text-lg font-bold text-gray-900">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total Amount */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{purchaseOrder.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Information */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Vendor Name</label>
                  <p className="text-lg font-semibold text-gray-900">{purchaseOrder.vendor_id.vendor_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{purchaseOrder.vendor_id.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{purchaseOrder.vendor_id.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{purchaseOrder.vendor_id.address}</p>
                </div>
                {purchaseOrder.vendor_id.gst_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">GST Number</label>
                    <p className="text-gray-900">{purchaseOrder.vendor_id.gst_number}</p>
                  </div>
                )}
                {purchaseOrder.vendor_id.payment_terms && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                    <p className="text-gray-900">{purchaseOrder.vendor_id.payment_terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Notes */}
            {(purchaseOrder.terms || purchaseOrder.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {purchaseOrder.terms && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Terms & Conditions</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{purchaseOrder.terms}</p>
                    </div>
                  )}
                  {purchaseOrder.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PurchaseOrderDetails;