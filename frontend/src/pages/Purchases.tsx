import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface PurchaseItem {
  id: string;
  name: string;
  batch: string;
  qty: number;
  purchaseRate: number;
  tax: number;
  mrp: number;
  discount: number;
  amount: number;
}

const Purchases = () => {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    {
      id: '1',
      name: 'Paracetamol 500mg',
      batch: 'B123',
      qty: 10,
      purchaseRate: 12.5,
      tax: 5,
      mrp: 20,
      discount: 2,
      amount: 125
    },
    {
      id: '2',
      name: 'Vitamin C Tablets',
      batch: 'V456',
      qty: 5,
      purchaseRate: 30,
      tax: 12,
      mrp: 40,
      discount: 0,
      amount: 150
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', batch: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Refs for modal inputs
  const nameRef = React.useRef<HTMLInputElement>(null);
  const batchRef = React.useRef<HTMLInputElement>(null);
  const qtyRef = React.useRef<HTMLInputElement>(null);
  const rateRef = React.useRef<HTMLInputElement>(null);
  const taxRef = React.useRef<HTMLInputElement>(null);
  const mrpRef = React.useRef<HTMLInputElement>(null);
  const discountRef = React.useRef<HTMLInputElement>(null);
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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
                  setNewProduct({ name: '', batch: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0 });
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input ref={nameRef} type="text" placeholder="Name" value={newProduct.name}
                          onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') batchRef.current?.focus(); }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                        <Input ref={batchRef} type="text" placeholder="Batch" value={newProduct.batch}
                          onChange={e => setNewProduct(p => ({ ...p, batch: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') qtyRef.current?.focus(); }} />
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
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white mt-6" onClick={() => {
                    const base = newProduct.qty * newProduct.purchaseRate;
                    const discountAmount = base * (newProduct.discount / 100);
                    const taxAmount = (base - discountAmount) * (newProduct.tax / 100);
                    const amount = base - discountAmount + taxAmount;
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
                    setNewProduct({ name: '', batch: '', qty: 1, purchaseRate: 0, tax: 0, mrp: 0, discount: 0, amount: 0 });
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
          <div>
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
            <select value={vendor} onChange={e => setVendor(e.target.value)} className="border rounded px-3 py-2 w-48">
              <option value="">Select Vendor</option>
              <option value="ABC Pharma">ABC Pharma</option>
              <option value="HealthCorp">HealthCorp</option>
              <option value="Medico Supplies">Medico Supplies</option>
            </select>
          </div>
          <div>
            <label className="block ml-5 text-sm font-medium text-gray-700 mb-1">Date</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
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
                          <span className="text-sm text-gray-900 font-semibold">₹{item.amount.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center flex gap-2 justify-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500" onClick={() => {
                            setEditIndex(idx);
                            setNewProduct({
                              name: item.name,
                              batch: item.batch,
                              qty: item.qty,
                              purchaseRate: item.purchaseRate,
                              tax: item.tax,
                              mrp: item.mrp,
                              discount: item.discount,
                              amount: item.amount
                            });
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
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Items</span>
                    <span className="font-medium text-gray-900">{purchaseItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tax</span>
                    <span className="font-medium text-gray-900">₹{purchaseItems.reduce((sum, item) => sum + ((item.qty * item.purchaseRate - (item.qty * item.purchaseRate * item.discount / 100)) * item.tax / 100), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Final Amount</span>
                    <span className="font-medium text-gray-900">₹{purchaseItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-semibold">
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