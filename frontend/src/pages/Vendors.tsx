import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface Vendor {
  _id: string;
  vendor_name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  payment_terms: string;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    phone: '',
    email: '',
    address: '',
    gst_number: '',
    payment_terms: 'Net 30'
  });

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

  // Add new vendor
  const handleAddVendor = async () => {
    if (!newVendor.vendor_name || !newVendor.phone || !newVendor.email) {
      alert('Please fill in all required fields (Name, Phone, Email)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        const savedVendor = await response.json();
        setVendors(prev => [...prev, savedVendor]);
        setModalOpen(false);
        setNewVendor({
          vendor_name: '',
          phone: '',
          email: '',
          address: '',
          gst_number: '',
          payment_terms: 'Net 30'
        });
        alert('Vendor added successfully!');
      } else {
        alert('Failed to add vendor');
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      alert('Error adding vendor');
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone.includes(searchTerm) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto h-full">
        <div className="flex h-full gap-6">
          {/* Main Vendors Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search vendors..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  className="bg-gray-900 hover:bg-gray-800 text-white ml-3" 
                  onClick={() => setModalOpen(true)}
                >
                  Add Vendor
                </Button>
              </div>
            </div>

            {/* Vendors Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <Card key={vendor._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {vendor.vendor_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 w-16">Phone:</span>
                          <span className="text-gray-900">{vendor.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-16">Email:</span>
                          <span className="text-gray-900">{vendor.email}</span>
                        </div>
                        {vendor.address && (
                          <div className="flex items-start">
                            <span className="text-gray-500 w-16">Address:</span>
                            <span className="text-gray-900">{vendor.address}</span>
                          </div>
                        )}
                        {vendor.gst_number && (
                          <div className="flex items-center">
                            <span className="text-gray-500 w-16">GST:</span>
                            <span className="text-gray-900">{vendor.gst_number}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-gray-500 w-16">Terms:</span>
                          <span className="text-gray-900">{vendor.payment_terms}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredVendors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No vendors found matching your search.' : 'No vendors added yet. Click "Add Vendor" to get started.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Vendor Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button 
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
                onClick={() => setModalOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Vendor</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter vendor name"
                    value={newVendor.vendor_name}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, vendor_name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input
                    type="text"
                    placeholder="Enter address"
                    value={newVendor.address}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <Input
                    type="text"
                    placeholder="Enter GST number"
                    value={newVendor.gst_number}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, gst_number: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select
                    value={newVendor.payment_terms}
                    onChange={(e) => setNewVendor(prev => ({ ...prev, payment_terms: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white mt-6" 
                onClick={handleAddVendor}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Vendor'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Vendors;