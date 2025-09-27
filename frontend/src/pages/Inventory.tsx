import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { FiSearch, FiFilter, FiPackage, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiTrendingUp, FiTrendingDown, FiAlertTriangle } from 'react-icons/fi';

interface ProductBatch {
  _id: string;
  batch_number: string;
  barcode: string;
  expiry_date: string | null;
  mrp: number;
  tax_rate: number;
  quantity_in_stock: number;
  createdAt: string;
}

interface Product {
  _id: string;
  product_name: string;
  category: string;
  hsn_code: string;
  description: string;
}

interface InventoryItem extends Product {
  batches: ProductBatch[];
  totalStock: number;
  totalValue: number;
  lowStock: boolean;
  expiringSoon: boolean;
}

const ITEMS_PER_PAGE = 12;

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out-of-stock, expiring
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<string[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringSoonItems: 0
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [inventoryItems, searchTerm, selectedCategory, stockFilter]);

  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching inventory data...');
      
      // Fetch all products
      const productsResponse = await fetch('http://localhost:5000/api/products');
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
      }
      const products: Product[] = await productsResponse.json();
      console.log('Fetched products:', products.length);

      if (!Array.isArray(products)) {
        throw new Error('Products response is not an array');
      }

      // Create simplified inventory data - just show products for now
      const inventoryData: InventoryItem[] = products.map(product => ({
        ...product,
        batches: [],
        totalStock: 0,
        totalValue: 0,
        lowStock: false,
        expiringSoon: false
      }));

      // Extract categories
      const categorySet = new Set<string>();
      products.forEach(product => {
        if (product.category && product.category.trim()) {
          categorySet.add(product.category.trim());
        }
      });

      setInventoryItems(inventoryData);
      setCategories(Array.from(categorySet).sort());

      // Set basic statistics
      setStats({
        totalProducts: products.length,
        totalStock: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: products.length, // All are out of stock since we're not fetching batches yet
        expiringSoonItems: 0
      });

      console.log('Inventory data loaded successfully');

    } catch (error) {
      console.error('Error fetching inventory data:', error);
      alert('Failed to load inventory data. Please make sure the backend server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = inventoryItems;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsn_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by stock status
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(item => item.lowStock);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(item => item.totalStock === 0);
          break;
        case 'expiring':
          filtered = filtered.filter(item => item.expiringSoon);
          break;
        case 'in-stock':
          filtered = filtered.filter(item => item.totalStock > 0);
          break;
      }
    }

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };



  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-lg text-gray-600">Track stock levels, manage products, and monitor inventory health</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <FiPackage className="text-2xl text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toLocaleString()}</p>
                </div>
                <FiGrid className="text-2xl text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
                <FiTrendingUp className="text-2xl text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                </div>
                <FiAlertTriangle className="text-2xl text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
                </div>
                <FiTrendingDown className="text-2xl text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringSoonItems}</p>
                </div>
                <FiAlertTriangle className="text-2xl text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FiFilter className="text-lg" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="all">All Products</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center space-x-1"
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Grid</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center space-x-1"
                >
                  <FiList className="w-4 h-4" />
                  <span>List</span>
                </Button>
              </div>

              <div className="text-sm text-gray-600 flex items-center">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FiPackage className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-500">
                {inventoryItems.length === 0 
                  ? "No products have been added to inventory yet." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentItems.map((item) => (
                  <Card key={item._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-500">{item.category || 'Uncategorized'}</p>
                          {item.hsn_code && (
                            <p className="text-xs text-gray-400">HSN: {item.hsn_code}</p>
                          )}
                        </div>

                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                            Product Listed
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className="text-sm text-gray-500">Not tracked</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Category:</span>
                            <span className="font-medium text-sm">{item.category || 'None'}</span>
                          </div>
                          {item.hsn_code && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">HSN:</span>
                              <span className="font-medium text-sm">{item.hsn_code}</span>
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            HSN Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{item.category || 'Uncategorized'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{item.hsn_code || '-'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={item.description}>
                                {item.description || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-1"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center space-x-1"
                      >
                        <span>Next</span>
                        <FiChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;