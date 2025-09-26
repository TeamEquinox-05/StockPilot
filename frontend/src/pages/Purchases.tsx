import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface PurchaseItem {
  id: string;
  name: string;
  batch: string;
  expiryDate: string;
  qty: number;
  purchaseRate: number;
  tax: number;
  mrp: number;
  discount: number;
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
  isNewProduct: boolean;
  latestDetails?: {
    batch_number: string;
    barcode: string;
    mrp: number;
    expiry_date?: string;
    purchase_rate: number;
    tax_percent: number;
    discount_percent: number;
  };
}

const Purchases = () => {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', batch: '', barcode: '', expiryDate: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Refs for modal inputs
  const nameRef = React.useRef<HTMLInputElement>(null);
  const batchRef = React.useRef<HTMLInputElement>(null);
  const expiryDateRef = React.useRef<HTMLInputElement>(null);
  const qtyRef = React.useRef<HTMLInputElement>(null);
  const rateRef = React.useRef<HTMLInputElement>(null);
  const taxRef = React.useRef<HTMLInputElement>(null);
  const mrpRef = React.useRef<HTMLInputElement>(null);
  const discountRef = React.useRef<HTMLInputElement>(null);
  const [vendor, setVendor] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [billNo, setBillNo] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  
  // Product autocomplete states
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [originalBatch, setOriginalBatch] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [pendingAutofill, setPendingAutofill] = useState<Product | null>(null);
  const [batches, setBatches] = useState<string[]>([]);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [batchSelectedFromSuggestions, setBatchSelectedFromSuggestions] = useState(false);

  // Fetch vendors from backend
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(v =>
    v.vendor_name.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  // Handle vendor selection
  const handleVendorSelect = (vendorName: string) => {
    setVendor(vendorName);
    setVendorSearchTerm(vendorName);
    setShowVendorDropdown(false);
  };

  // Search products from backend
  const searchProducts = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setProducts([]);
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/search?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  // Search batches for a specific product
  const searchBatches = async (productId: string, searchTerm: string) => {
    if (!productId) {
      setBatches([]);
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}/batches?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data.map((batch: any) => batch.batch_number));
      }
    } catch (error) {
      console.error('Error searching batches:', error);
      setBatches([]);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductSearchTerm(product.product_name);
    setShowProductDropdown(false);
    setIsNewProduct(false);
    setIsAutoFilling(true);
    setBatchSelectedFromSuggestions(false);
    
    // Set pending autofill to be processed in useEffect
    setPendingAutofill(product);
  };

  // Generate unique barcode using timestamp (numbers only)
  const generateBarcode = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const barcode = `${timestamp}${randomSuffix}`;
    setNewProduct(prev => ({ ...prev, barcode }));
  };

  // Handle new product creation
  const handleNewProduct = () => {
    setIsNewProduct(true);
    setSelectedProduct(null);
    setOriginalBatch('');
    setBatchSelectedFromSuggestions(false);
    setNewProduct(prev => ({
      ...prev,
      name: productSearchTerm,
      batch: '',
      barcode: '',
      expiryDate: '',
      purchaseRate: 0,
      tax: 0,
      mrp: 0,
      discount: 0
    }));
    setShowProductDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.vendor-autocomplete')) {
        setShowVendorDropdown(false);
      }
      if (!target.closest('.product-autocomplete')) {
        setShowProductDropdown(false);
      }
      if (!target.closest('.batch-autocomplete')) {
        setShowBatchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle pending autofill (without barcode auto-fill)
  useEffect(() => {
    if (pendingAutofill) {
      if (pendingAutofill.latestDetails) {
        const batchNumber = pendingAutofill.latestDetails?.batch_number || '';
        
        setNewProduct(prev => ({
          ...prev,
          name: pendingAutofill.product_name,
          batch: batchNumber,
          barcode: '', // Don't auto-fill barcode
          expiryDate: pendingAutofill.latestDetails?.expiry_date ? new Date(pendingAutofill.latestDetails.expiry_date).toISOString().slice(0, 10) : '',
          purchaseRate: pendingAutofill.latestDetails?.purchase_rate || 0,
          tax: pendingAutofill.latestDetails?.tax_percent || 0,
          mrp: pendingAutofill.latestDetails?.mrp || 0,
          discount: pendingAutofill.latestDetails?.discount_percent || 0
        }));
        setOriginalBatch(batchNumber);
      } else {
        setNewProduct(prev => ({
          ...prev,
          name: pendingAutofill.product_name,
          batch: '',
          barcode: '',
          expiryDate: ''
        }));
        setOriginalBatch('');
      }
      
      setPendingAutofill(null);
      setIsAutoFilling(false);
    }
  }, [pendingAutofill]);

  // Add new purchase item logic (could be a modal or inline row)

  return (
    <DashboardLayout>
      {/* Vendor and Date below nav */}
      <div className="max-w-full mx-auto h-full">
       
        <div className="flex h-full gap-6">
          {/* Main Purchases Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by name"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white ml-3" onClick={() => {
                  setEditIndex(null);
                  setNewProduct({ name: '', batch: '', barcode: '', expiryDate: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0 });
                  setProductSearchTerm('');
                  setIsNewProduct(false);
                  setSelectedProduct(null);
                  setOriginalBatch('');
                  setBatchSelectedFromSuggestions(false);
                  setModalOpen(true);
                }}>
                  Add Product
                </Button>
            {/* Add Product Modal */}
            {modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setModalOpen(false)}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Add Product</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative product-autocomplete">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name {isNewProduct && <span className="text-green-600 text-xs">(Adding New Product)</span>}
                        </label>
                        <Input 
                          ref={nameRef} 
                          type="text" 
                          placeholder="Search or enter product name..." 
                          value={productSearchTerm || newProduct.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            setProductSearchTerm(value);
                            setNewProduct(p => ({ ...p, name: value }));
                            searchProducts(value);
                            setShowProductDropdown(true);
                            setIsNewProduct(false);
                          }}
                          onFocus={() => {
                            if (productSearchTerm) {
                              searchProducts(productSearchTerm);
                              setShowProductDropdown(true);
                            }
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') batchRef.current?.focus(); }} 
                        />
                        
                        {/* Product Autocomplete Dropdown */}
                        {showProductDropdown && products.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                            {products.map((product) => (
                              <div
                                key={product._id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => handleProductSelect(product)}
                              >
                                <div className="font-medium">{product.product_name}</div>
                                <div className="text-gray-500 text-xs">
                                  {product.category} • 
                                  {product.latestDetails ? 
                                    ` Last: ₹${product.latestDetails.purchase_rate} • ${product.latestDetails.tax_percent}% tax` : 
                                    ' No previous purchase'
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* New product option */}
                        {showProductDropdown && productSearchTerm && products.length === 0 && productSearchTerm.length >= 2 && (
                          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg">
                            <div 
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={handleNewProduct}
                            >
                              <div className="font-medium text-green-600">+ Add "{productSearchTerm}" as new product</div>
                              <div className="text-gray-500 text-xs">This will create a new product in the system</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative batch-autocomplete">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch {selectedProduct && !isNewProduct && <span className="text-blue-600 text-xs">(Using existing product)</span>}
                        </label>
                        <Input ref={batchRef} type="text" placeholder="Batch number" value={newProduct.batch}
                          onChange={e => {
                            const newBatch = e.target.value;
                            
                            // Reset batch selection flag when user types manually
                            setBatchSelectedFromSuggestions(false);
                            
                            // Search for batches if product is selected
                            if (selectedProduct && !isNewProduct) {
                              searchBatches(selectedProduct._id, newBatch);
                              setShowBatchDropdown(true);
                            }
                            
                            // Clear barcode when batch changes from original (manual change)
                            if (!isAutoFilling && newBatch !== originalBatch && originalBatch !== '') {
                              setNewProduct(p => ({ ...p, batch: newBatch, barcode: '' }));
                            } else {
                              setNewProduct(p => ({ ...p, batch: newBatch }));
                            }
                          }}
                          onFocus={() => {
                            if (selectedProduct && !isNewProduct && newProduct.batch) {
                              searchBatches(selectedProduct._id, newProduct.batch);
                              setShowBatchDropdown(true);
                            }
                          }}
                          onKeyDown={e => { 
                            if (e.key === 'Enter') {
                              setShowBatchDropdown(false);
                              qtyRef.current?.focus();
                            }
                          }} />
                        
                        {/* Batch Autocomplete Dropdown */}
                        {showBatchDropdown && selectedProduct && !isNewProduct && batches.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                            {batches.map((batchNumber, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => {
                                  const newBatch = batchNumber;
                                  setNewProduct(p => ({ 
                                    ...p, 
                                    batch: newBatch,
                                    barcode: newBatch !== originalBatch ? '' : p.barcode
                                  }));
                                  setBatchSelectedFromSuggestions(true);
                                  setShowBatchDropdown(false);
                                }}
                              >
                                <div className="font-medium">{batchNumber}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Show barcode field only for new products or when batch changed manually (not from suggestions) */}
                      {(isNewProduct || (selectedProduct && originalBatch && newProduct.batch !== originalBatch && !batchSelectedFromSuggestions)) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Barcode {isNewProduct ? '(Optional)' : '(Required for new batch)'}
                          </label>
                          <div className="flex gap-2">
                            <Input 
                              type="text" 
                              placeholder={isNewProduct ? "Enter barcode or generate" : "Enter barcode for this batch"} 
                              value={newProduct.barcode}
                              onChange={e => setNewProduct(p => ({ ...p, barcode: e.target.value }))} 
                              className="flex-1"
                            />
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={generateBarcode}
                              className="whitespace-nowrap"
                            >
                              Generate
                            </Button>
                          </div>
                          {newProduct.barcode && (
                            <p className="text-xs text-gray-500 mt-1">
                              {isNewProduct ? 'Generated:' : 'Barcode:'} {newProduct.barcode}
                            </p>
                          )}
                          {selectedProduct && !isNewProduct && !newProduct.barcode && originalBatch && newProduct.batch !== originalBatch && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Barcode cleared - different batch needs new barcode
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date (Optional)
                        </label>
                        <Input 
                          ref={expiryDateRef}
                          type="date" 
                          value={newProduct.expiryDate}
                          onChange={e => setNewProduct(p => ({ ...p, expiryDate: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') qtyRef.current?.focus(); }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <Input ref={qtyRef} type="number" min={1} placeholder="Qty" value={newProduct.qty}
                          onChange={e => setNewProduct(p => ({ ...p, qty: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') rateRef.current?.focus(); }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Rate</label>
                        <Input ref={rateRef} type="number" min={0} step={0.01} placeholder="Purchase Rate" value={newProduct.purchaseRate}
                          onChange={e => setNewProduct(p => ({ ...p, purchaseRate: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') taxRef.current?.focus(); }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax (%)</label>
                        <Input ref={taxRef} type="number" min={0} step={0.01} placeholder="Tax (%)" value={newProduct.tax}
                          onChange={e => setNewProduct(p => ({ ...p, tax: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') mrpRef.current?.focus(); }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                        <Input ref={mrpRef} type="number" min={0} step={0.01} placeholder="MRP" value={newProduct.mrp}
                          onChange={e => setNewProduct(p => ({ ...p, mrp: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') discountRef.current?.focus(); }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                        <Input ref={discountRef} type="number" min={0} max={100} step={0.01} placeholder="Discount (%)" value={newProduct.discount}
                          onChange={e => setNewProduct(p => ({ ...p, discount: Number(e.target.value) }))}
                          onKeyDown={e => { if (e.key === 'Enter') nameRef.current?.focus(); }} />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <span className="text-base font-semibold text-gray-900">
                          ₹{(() => {
                            const base = newProduct.qty * newProduct.purchaseRate;
                            const discountAmount = base * (newProduct.discount / 100);
                            const taxAmount = (base - discountAmount) * (newProduct.tax / 100);
                            return (base - discountAmount + taxAmount).toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white mt-6" onClick={async () => {
                    if (!newProduct.name || !newProduct.batch) {
                      alert('Please enter product name and batch');
                      return;
                    }

                    const base = newProduct.qty * newProduct.purchaseRate;
                    const discountAmount = base * (newProduct.discount / 100);
                    const taxAmount = (base - discountAmount) * (newProduct.tax / 100);
                    const amount = base - discountAmount + taxAmount;
                    
                    // If it's a new product, create it in the backend first
                    if (isNewProduct) {
                      try {
                        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            product_name: newProduct.name,
                            category: '',
                            hsn_code: '',
                            description: ''
                          })
                        });
                        
                        if (response.ok) {
                          console.log('New product created in database');
                        } else if (response.status === 409) {
                          console.log('Product already exists');
                        }
                      } catch (error) {
                        console.error('Error creating product:', error);
                      }
                    }
                    
                    if (editIndex !== null) {
                      setPurchaseItems(items => items.map((item, idx) => idx === editIndex ? { ...item, ...newProduct, amount } : item));
                    } else {
                      setPurchaseItems(items => [
                        ...items,
                        {
                          id: Date.now().toString(),
                          ...newProduct,
                          amount
                        }
                      ]);
                    }
                    setModalOpen(false);
                    setNewProduct({ name: '', batch: '', barcode: '', expiryDate: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0 });
                    setProductSearchTerm('');
                    setIsNewProduct(false);
                    setSelectedProduct(null);
                    setEditIndex(null);
                  }}>
                    {editIndex !== null ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            )}
              </div>
            </div>
 
              <div className="flex items-center gap-6 mb-4">
          <div className="relative vendor-autocomplete">
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search or select vendor..."
                value={vendorSearchTerm}
                onChange={(e) => {
                  setVendorSearchTerm(e.target.value);
                  setShowVendorDropdown(true);
                  if (!e.target.value) {
                    setVendor('');
                  }
                }}
                onFocus={() => setShowVendorDropdown(true)}
                className="w-48 ml-5"
              />
              
              {/* Autocomplete Dropdown */}
              {showVendorDropdown && filteredVendors.length > 0 && (
                <div className="absolute top-full left-5 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredVendors.map((v) => (
                    <div
                      key={v._id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleVendorSelect(v.vendor_name)}
                    >
                      <div className="font-medium">{v.vendor_name}</div>
                      <div className="text-gray-500 text-xs">{v.phone} • {v.email}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No vendors found message */}
              {showVendorDropdown && vendorSearchTerm && filteredVendors.length === 0 && (
                <div className="absolute top-full left-5 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No vendors found. <span className="text-blue-600 cursor-pointer hover:underline">Add new vendor</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Bill No</label>
            <Input 
              type="text" 
              placeholder="Enter bill number" 
              value={billNo} 
              onChange={e => setBillNo(e.target.value)} 
              className="w-40" 
            />
          </div>
          <div>
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <div className="flex items-center space-x-2">
              <select 
                value={paymentStatus} 
                onChange={(e) => setPaymentStatus(e.target.value)}
                className={`w-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  paymentStatus === 'Paid' ? 'border-green-300 bg-green-50' :
                  paymentStatus === 'Partial' ? 'border-yellow-300 bg-yellow-50' :
                  'border-red-300 bg-red-50'
                }`}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
            {/* Purchases Table */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-y-auto h-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (excl. tax)</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (incl. tax)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.batch}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-sm font-medium text-gray-900">{item.qty}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-500">₹{item.purchaseRate.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-500">{item.tax}%</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-500">₹{item.mrp.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-500">₹{item.discount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-700">₹{(() => {
                            const base = item.qty * item.purchaseRate;
                            const discountAmount = base * (item.discount / 100);
                            return (base - discountAmount).toFixed(2);
                          })()}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-900 font-semibold">₹{item.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center flex gap-2 justify-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500" onClick={() => {
                            setEditIndex(idx);
                            setNewProduct({
                              name: item.name,
                              batch: item.batch,
                              barcode: '', // Will be filled if editing existing product
                              expiryDate: item.expiryDate, // Fill with existing expiry date
                              qty: item.qty,
                              purchaseRate: item.purchaseRate,
                              tax: item.tax,
                              mrp: item.mrp,
                              discount: item.discount,
                              amount: item.amount
                            });
                            setProductSearchTerm(item.name);
                            setIsNewProduct(false);
                            setModalOpen(true);
                          }}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Purchase Summary Sidebar */}
          <div className="w-96 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-3 text-sm mb-6">
                  {vendor && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vendor</span>
                        <span className="font-medium text-gray-900">{vendor}</span>
                      </div>
                      {billNo && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bill No</span>
                          <span className="font-medium text-gray-900">{billNo}</span>
                        </div>
                      )}
                      <hr className="border-gray-200" />
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Items</span>
                    <span className="font-medium text-gray-900">{purchaseItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Quantity</span>
                    <span className="font-medium text-gray-900">{purchaseItems.reduce((sum, item) => sum + item.qty, 0)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">₹{purchaseItems.reduce((sum, item) => {
                      const base = item.qty * item.purchaseRate;
                      return sum + base;
                    }, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Discount</span>
                    <span className="font-medium text-red-600">-₹{purchaseItems.reduce((sum, item) => {
                      const base = item.qty * item.purchaseRate;
                      const discountAmount = base * (item.discount / 100);
                      return sum + discountAmount;
                    }, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tax</span>
                    <span className="font-medium text-green-600">+₹{purchaseItems.reduce((sum, item) => {
                      const base = item.qty * item.purchaseRate;
                      const discountAmount = base * (item.discount / 100);
                      const taxAmount = (base - discountAmount) * (item.tax / 100);
                      return sum + taxAmount;
                    }, 0).toFixed(2)}</span>
                  </div>
                  
                  {/* Tax Split Breakdown */}
                  <div className="mt-2 pl-4 space-y-1 text-xs">
                    {(() => {
                      const taxSplit = { 5: 0, 12: 0, 18: 0, 28: 0 };
                      purchaseItems.forEach(item => {
                        const base = item.qty * item.purchaseRate;
                        const discountAmount = base * (item.discount / 100);
                        const taxAmount = (base - discountAmount) * (item.tax / 100);
                        if ([5, 12, 18, 28].includes(item.tax)) {
                          taxSplit[item.tax as keyof typeof taxSplit] += taxAmount;
                        }
                      });
                      
                      return Object.entries(taxSplit).map(([rate, amount]) => {
                        if (amount > 0) {
                          return (
                            <div key={rate} className="flex justify-between">
                              <span className="text-gray-400">Tax @ {rate}%</span>
                              <span className="text-gray-400">₹{amount.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return null;
                      }).filter(Boolean);
                    })()}
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Final Amount</span>
                    <span className="font-bold text-gray-900 text-lg">₹{purchaseItems.reduce((sum, item) => {
                      const base = item.qty * item.purchaseRate;
                      const discountAmount = base * (item.discount / 100);
                      const taxAmount = (base - discountAmount) * (item.tax / 100);
                      const amount = base - discountAmount + taxAmount;
                      return sum + amount;
                    }, 0).toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Payment Status</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                      paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-semibold"
                  onClick={async () => {
                    if (!vendor || !billNo || purchaseItems.length === 0) {
                      alert('Please select vendor, enter bill number, and add at least one item');
                      return;
                    }

                    try {
                      const purchaseData = {
                        vendor_name: vendor,
                        bill_no: billNo,
                        purchase_date: date,
                        items: purchaseItems.map(item => ({
                          name: item.name,
                          batch: item.batch,
                          barcode: '',
                          expiryDate: item.expiryDate,
                          qty: item.qty,
                          purchaseRate: item.purchaseRate,
                          tax: item.tax,
                          mrp: item.mrp,
                          discount: item.discount
                        })),
                        payment_status: paymentStatus
                      };

                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/purchases`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(purchaseData)
                      });

                      if (response.ok) {
                        const result = await response.json();
                        alert('Purchase completed successfully!');
                        
                        // Reset form
                        setPurchaseItems([]);
                        setVendor('');
                        setVendorSearchTerm('');
                        setBillNo('');
                        setDate(new Date().toISOString().slice(0, 10));
                        setPaymentStatus('Pending');
                        
                        console.log('Purchase created:', result);
                      } else {
                        const error = await response.json();
                        alert(`Error: ${error.message}`);
                      }
                    } catch (error) {
                      console.error('Error completing purchase:', error);
                      alert('Error completing purchase. Please try again.');
                    }
                  }}
                >
                  Complete Purchase
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Purchases;