import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const Sales = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: '1', name: 'Organic Apples', price: 1.50, quantity: 2, total: 3.00 },
    { id: '2', name: 'Whole Wheat Bread', price: 2.50, quantity: 1, total: 2.50 },
    { id: '3', name: 'Almond Milk', price: 3.00, quantity: 3, total: 9.00 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0.00);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.06875;
  const tax = subtotal * taxRate;
  const total = subtotal - discount + tax;

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items => 
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.price
          };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  // Simulate barcode scan and add item
  const handleScan = () => {
    // For demo, just add a dummy item
    setCartItems(items => [
      ...items,
      { id: Date.now().toString(), name: `Scanned Item (${scannedCode})`, price: 2.00, quantity: quantityInput, total: 2.00 * quantityInput }
    ]);
    setScannerOpen(false);
    setScannedCode('');
    setQuantityInput(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto h-full">
        <div className="flex h-full gap-6">
          {/* Main Sales Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">Sales & Checkout</h1>
    
                </div>
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search for products by name or SKU"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <Button className="bg-gray-900 hover:bg-gray-800 text-white ml-3" onClick={() => setScannerOpen(true)}>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                    </svg>
                    Start Scan
                  </Button>
              </div>
            </div>

            {/* Cart Table */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-y-auto h-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">₹{item.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </Button>
                            <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V18M6 12h12" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-500">₹{item.total.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            onClick={() => removeItem(item.id)}
                          >
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

          {/* Checkout Sidebar */}
          <div className="w-96 flex flex-col">
            {/* Barcode Scanner */}
            {/* Barcode Scanner Modal */}
            {scannerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center  bg-black/50">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setScannerOpen(false)}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="mb-4 flex flex-col items-center">
                    <div className="aspect-[4/3] w-full bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-white/60">[Camera Preview]</span>
                    </div>
                    <Input
                      type="text"
                      placeholder="Barcode Value"
                      value={scannedCode}
                      onChange={e => setScannedCode(e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Quantity"
                      value={quantityInput}
                      onChange={e => setQuantityInput(Number(e.target.value))}
                      className="mb-4"
                    />
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={handleScan}>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Checkout</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Discount</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-24 text-right"
                    />
                    <span className="font-medium text-gray-900">₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax (6.875%)</span>
                    <span className="font-medium text-gray-900">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'card', 'upi'].map((method) => (
                      <Button
                        key={method}
                        variant={paymentMethod === method ? "default" : "outline"}
                        size="sm"
                        className={`text-xs ${paymentMethod === method ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}`}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-semibold">
                  Complete Sale
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Sales;