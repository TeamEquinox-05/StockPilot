import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { FiArrowLeft, FiPlus, FiDownload, FiEye, FiClipboard } from 'react-icons/fi';
import jsPDF from 'jspdf';

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



const ViewPurchaseOrders = () => {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [purchaseOrders, searchTerm, statusFilter, priorityFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders`);
      
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      } else {
        console.error('Failed to fetch purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const filterOrders = () => {
    let filtered = purchaseOrders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor_id.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    setFilteredOrders(filtered);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setPurchaseOrders(prev =>
          prev.map(order =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const downloadPurchaseOrder = (order: PurchaseOrder) => {
    generatePurchaseOrderPDF(order);
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-1.5`}></span>
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase orders...</p>
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
          <Button
            variant="outline"
            onClick={() => navigate('/purchases')}
            className="mb-4 flex items-center space-x-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Purchase Management</span>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
              <p className="text-lg text-gray-600">View and manage all purchase orders</p>
            </div>
            <Button
              onClick={() => navigate('/purchases/create-order')}
              className="bg-gray-900 hover:bg-gray-800 text-white flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Purchase Order</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Search by order number or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Partially_Received">Partially Received</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="all">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Purchase Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FiClipboard className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                <p className="text-gray-500 mb-6">
                  {purchaseOrders.length === 0 
                    ? "You haven't created any purchase orders yet." 
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                <Button
                  onClick={() => navigate('/purchases/create-order')}
                  className="bg-gray-900 hover:bg-gray-800 text-white flex items-center space-x-2 mx-auto"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Create First Purchase Order</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.vendor_id.vendor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.vendor_id.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(order.orderDate).toLocaleDateString('en-IN')}
                            </div>
                            <div className="mt-1">
                              {getPriorityBadge(order.priority)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {getStatusBadge(order.status)}
                            {order.status !== 'Received' && order.status !== 'Cancelled' && (
                              <select
                                value={order.status}
                                onChange={(e) => updateStatus(order._id, e.target.value)}
                                className="block w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadPurchaseOrder(order)}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center space-x-1"
                            >
                              <FiDownload className="w-3 h-3" />
                              <span>PDF</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/purchase-orders/${order._id}`)}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center space-x-1"
                            >
                              <FiEye className="w-3 h-3" />
                              <span>View</span>
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

export default ViewPurchaseOrders;