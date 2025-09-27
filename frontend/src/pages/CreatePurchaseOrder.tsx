import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiTrash2, 
  FiMessageSquare, 
  FiMail, 
  FiAlertTriangle, 
  FiInfo,
  FiPhone
} from 'react-icons/fi';

interface PurchaseOrderItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  estimatedRate: number;
  expectedDelivery: string;
  notes: string;
  amount: number;
}

interface Vendor {
  _id: string;
  vendor_name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  payment_terms: string;
}

interface Product {
  _id: string;
  product_name: string;
  category: string;
  hsn_code: string;
  description: string;
  latestPurchaseRate?: number;
  latestTaxRate?: number;
  avgPurchaseRate?: number;
}



const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Product autocomplete states
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  

  
  // Form states
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // Notification states
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  // Item form state
  const [newItem, setNewItem] = useState<PurchaseOrderItem>({
    id: '',
    productName: '',
    description: '',
    quantity: 0,
    estimatedRate: 0,
    expectedDelivery: '',
    notes: '',
    amount: 0
  });

  // Load vendors and products on component mount
  useEffect(() => {
    fetchVendors();
    fetchProducts();
    generateOrderNumber();
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDelivery(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  }, []);



  // Fetch next auto-generated order number
  const generateOrderNumber = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders/next-number`);
      
      if (response.ok) {
        const data = await response.json();
        setOrderNumber(data.nextOrderNumber);
      } else {
        // Fallback to local generation if API fails
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const time = String(Date.now()).slice(-4);
        setOrderNumber(`PO-${year}-${month}-${time}`);
      }
    } catch (error) {
      console.error('Error fetching next order number:', error);
      // Fallback to local generation
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const time = String(Date.now()).slice(-4);
      setOrderNumber(`PO-${year}-${month}-${time}`);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setVendorsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/with-pricing`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };



  // Filter products based on search term
  useEffect(() => {
    if (productSearchTerm.length >= 2) {
      const filtered = products.filter(product =>
        product.product_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 10)); // Limit to 10 suggestions
      setShowProductSuggestions(true);
    } else {
      setFilteredProducts([]);
      setShowProductSuggestions(false);
    }
  }, [productSearchTerm, products]);

  // Handle product selection from autocomplete
  const selectProduct = (product: Product) => {
    const calculatedPrice = calculateProductPrice(product);
    setProductSearchTerm(product.product_name);
    setNewItem(prev => ({
      ...prev,
      productName: product.product_name,
      description: product.description || product.category,
      estimatedRate: calculatedPrice
    }));
    setShowProductSuggestions(false);
  };

  // Calculate product price including taxes
  const calculateProductPrice = (product: Product) => {
    const baseRate = (product.latestPurchaseRate || product.avgPurchaseRate || 0);
    const taxRate = (product.latestTaxRate || 0);
    return Math.round((baseRate * (1 + taxRate / 100)) * 100) / 100; // Round to 2 decimal places
  };



  // Calculate item amount when quantity or rate changes
  useEffect(() => {
    const amount = newItem.quantity * newItem.estimatedRate;
    setNewItem(prev => ({ ...prev, amount }));
  }, [newItem.quantity, newItem.estimatedRate]);

  const addItem = () => {
    if (!newItem.productName || newItem.quantity <= 0 || newItem.estimatedRate <= 0) {
      alert('Please fill in all required fields for the item');
      return;
    }

    const item: PurchaseOrderItem = {
      ...newItem,
      id: Date.now().toString()
    };

    setOrderItems(prev => [...prev, item]);
    
    // Reset form
    setNewItem({
      id: '',
      productName: '',
      description: '',
      quantity: 0,
      estimatedRate: 0,
      expectedDelivery: expectedDelivery,
      notes: '',
      amount: 0
    });
    
    // Reset product search
    setProductSearchTerm('');
    setShowProductSuggestions(false);
  };

  const removeItem = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'estimatedRate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.estimatedRate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendor) {
      alert('Please select a vendor');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one item to the purchase order');
      return;
    }

    setIsLoading(true);

    const purchaseOrderData = {
      // orderNumber is auto-generated on backend
      vendorId: selectedVendor._id,
      orderDate,
      expectedDelivery,
      priority,
      notes,
      terms,
      items: orderItems,
      totalAmount: calculateTotal(),
      status: 'Draft',
      notifications: {
        whatsapp: sendWhatsApp,
        email: sendEmail
      }
    };

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message with notification status
        let message = 'Purchase Order created successfully!';
        let hasErrors = false;
        
        if (result.notifications) {
          if (result.notifications.whatsapp) {
            if (result.notifications.whatsapp.success) {
              message += '\n\n✅ WhatsApp: Message sent to vendor successfully!';
            } else {
              hasErrors = true;
              const error = result.notifications.whatsapp.error;
              if (error.includes('WhatsApp Channel Error')) {
                message += '\n\n📱 WhatsApp Setup Required:';
                message += '\n• Use Twilio sandbox number: +1 415 523 8886';
                message += '\n• Vendor must send "join <code>" to that number first';
                message += '\n• Check WHATSAPP_QUICKFIX.md for detailed setup';
              } else {
                message += '\n\n❌ WhatsApp failed: ' + error;
              }
            }
          }
          
          if (result.notifications.email) {
            if (result.notifications.email.success) {
              message += '\n\n✅ Email: Purchase order sent with PDF attachment!';
            } else {
              hasErrors = true;
              message += '\n\n❌ Email failed: ' + result.notifications.email.error;
              message += '\n• Check your email configuration in .env file';
            }
          }
        }
        
        if (hasErrors) {
          message += '\n\n💡 Note: Purchase order was created successfully.';
          message += '\nOnly the notifications had issues.';
        }
        
        alert(message);
        
        // Reset form
        setOrderItems([]);
        setSelectedVendor(null);
        setNotes('');
        setTerms('');
        setSendWhatsApp(false);
        setSendEmail(false);
        generateOrderNumber();
        
        // Navigate back to purchases page
        navigate('/purchases');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to create purchase order'}`);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Error creating purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

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
            <FiArrowLeft className="h-4 w-4" />
            <span>Back to Purchase Management</span>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Create Purchase Order</h1>
              <p className="text-base sm:text-lg text-gray-600">Generate purchase orders to send to vendors</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-gray-500">Order #</div>
              <div className="text-lg font-semibold text-gray-900">{orderNumber}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number (Auto-Generated)
                  </label>
                  <Input
                    type="text"
                    value={orderNumber}
                    className="w-full bg-gray-50 text-gray-600"
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Date
                  </label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery
                  </label>
                  <Input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vendor *
                  </label>
                  {vendorsLoading ? (
                    <div className="p-3 text-gray-500">Loading vendors...</div>
                  ) : (
                    <select
                      value={selectedVendor?._id || ''}
                      onChange={(e) => {
                        const vendor = vendors.find(v => v._id === e.target.value);
                        setSelectedVendor(vendor || null);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a vendor...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.vendor_name} - {vendor.phone}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {selectedVendor && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Vendor Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Email:</span> {selectedVendor.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
                      <p><span className="font-medium">Payment Terms:</span> {selectedVendor.payment_terms}</p>
                      {selectedVendor.address && (
                        <p><span className="font-medium">Address:</span> {selectedVendor.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Add Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Items</CardTitle>
              <Button
                type="button"
                onClick={addItem}
                className="bg-gray-900 hover:bg-gray-800 text-white flex items-center space-x-2"
              >
                <FiPlus className="h-4 w-4" />
                <span>Add Item</span>
              </Button>
            </CardHeader>
            <CardContent id="item-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Start typing product name..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setNewItem(prev => ({ ...prev, productName: e.target.value }));
                    }}
                    onFocus={() => {
                      if (filteredProducts.length > 0) {
                        setShowProductSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow clicking on suggestions
                      setTimeout(() => setShowProductSuggestions(false), 200);
                    }}
                    className="w-full"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showProductSuggestions && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product._id}
                          className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          onClick={() => selectProduct(product)}
                        >
                          <div className="font-medium text-gray-900">{product.product_name}</div>
                          <div className="text-sm text-gray-500">
                            {product.category}
                            {(product.avgPurchaseRate || 0) > 0 && (
                              <span className="ml-2 text-green-600">
                                • Avg Price: ₹{(product.avgPurchaseRate || 0).toFixed(2)}
                                {(product.latestTaxRate || 0) > 0 && ` (+${product.latestTaxRate}% tax)`}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    type="text"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Rate *
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newItem.estimatedRate || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <Input
                    type="text"
                    value={formatCurrency(newItem.amount)}
                    readOnly
                    className="w-full bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({orderItems.length})</CardTitle>
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
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="text"
                              value={item.productName}
                              onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                              className="w-full min-w-32"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="w-full min-w-32"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="number"
                              value={item.estimatedRate}
                              onChange={(e) => updateItem(item.id, 'estimatedRate', parseFloat(e.target.value) || 0)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <FiTrash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          Total Amount:
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {formatCurrency(calculateTotal())}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms and Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter terms and conditions..."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Additional notes or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FiMessageSquare className="text-lg" />
                <span>Send Notifications</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Choose how to notify the vendor about this purchase order
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="whatsapp-notification"
                      checked={sendWhatsApp}
                      onChange={(e) => setSendWhatsApp(e.target.checked)}
                      className="w-5 h-5 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="whatsapp-notification" className="flex items-center cursor-pointer">
                        <FiMessageSquare className="text-2xl mr-3 text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">WhatsApp Message</div>
                          <div className="text-xs text-gray-500">
                            Send purchase order details via WhatsApp
                            {selectedVendor?.phone && (
                              <span className="flex items-center text-green-600 mt-1">
                                <FiPhone className="mr-1" /> {selectedVendor.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      id="email-notification"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-5 h-5 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="email-notification" className="flex items-center cursor-pointer">
                        <FiMail className="text-2xl mr-3 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Email Notification</div>
                          <div className="text-xs text-gray-500">
                            Send detailed purchase order via email with PDF attachment
                            {selectedVendor?.email && (
                              <span className="flex items-center text-blue-600 mt-1">
                                <FiMail className="mr-1" /> {selectedVendor.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {!selectedVendor && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <FiAlertTriangle className="mr-2" />
                    Please select a vendor first to see their contact information for notifications.
                  </p>
                </div>
              )}

              {selectedVendor && (!selectedVendor.phone || !selectedVendor.email) && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800 flex items-start">
                    <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Some contact information is missing for the selected vendor:
                      {!selectedVendor.phone && <span className="block">• WhatsApp requires phone number</span>}
                      {!selectedVendor.email && <span className="block">• Email requires email address</span>}
                    </span>
                  </p>
                </div>
              )}

              {sendWhatsApp && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 flex items-center mb-2">
                    <FiPhone className="mr-2" />
                    <strong>WhatsApp Setup Required:</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 ml-4 list-disc">
                    <li>Vendor must first send "join &lt;code&gt;" to +1 415 523 8886</li>
                    <li>Check WHATSAPP_QUICKFIX.md for complete setup instructions</li>
                    <li>If setup is incomplete, WhatsApp notification may fail</li>
                  </ul>
                </div>
              )}

              {(sendWhatsApp || sendEmail) && selectedVendor && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 flex items-center">
                    <FiInfo className="mr-2" />
                    Selected notifications will be sent automatically after the purchase order is created successfully.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary and Submit */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Items:</span>
                    <span className="text-sm font-medium">{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Quantity:</span>
                    <span className="text-sm font-medium">
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !selectedVendor || orderItems.length === 0}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-lg"
                  >
                    {isLoading ? 'Creating Purchase Order...' : 'Create Purchase Order'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel? All data will be lost.')) {
                        navigate('/purchases');
                      }
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreatePurchaseOrder;