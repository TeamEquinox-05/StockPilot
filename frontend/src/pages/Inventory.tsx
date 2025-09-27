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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out-of-stock, expiring
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [currentPage, searchTerm, selectedCategory, stockFilter]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/categories');
      if (response.ok) {
        const categories = await response.json();
        setCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching inventory data...');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: searchTerm,
        category: selectedCategory,
        stockFilter: stockFilter
      });

      const response = await fetch(`http://localhost:5000/api/products/inventory-paginated?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched paginated inventory:', data);

      setInventoryItems(data.items || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false
      });
      setStats(data.stats || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
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

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedCategory, stockFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };



  // Current items are already filtered and paginated from the API
  const currentItems = inventoryItems;

  const goToPage = (page: number) => {
    setCurrentPage(page);
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
                  <option value="all">All Stock Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="expiring">Expiring Soon</option>
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
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, pagination.totalItems)} of {pagination.totalItems} items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        {inventoryItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FiPackage className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
              <p className="text-gray-500">
                {pagination.totalItems === 0 
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

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.totalStock === 0 
                              ? 'text-red-600 bg-red-50' 
                              : item.lowStock 
                                ? 'text-yellow-600 bg-yellow-50' 
                                : 'text-green-600 bg-green-50'
                          }`}>
                            {item.totalStock === 0 ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock'}
                          </span>
                          {item.expiringSoon && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-50">
                              Expiring Soon
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`font-medium text-sm ${item.totalStock === 0 ? 'text-red-600' : item.lowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                              {item.totalStock} units
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Batches:</span>
                            <span className="font-medium text-sm">{item.batches.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Value:</span>
                            <span className="font-medium text-sm">{formatCurrency(item.totalValue)}</span>
                          </div>
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
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                {item.hsn_code && (
                                  <div className="text-sm text-gray-500">HSN: {item.hsn_code}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{item.category || 'Uncategorized'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`text-sm font-medium ${
                                item.totalStock === 0 ? 'text-red-600' : 
                                item.lowStock ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {item.totalStock} units
                              </div>
                              <div className="text-xs text-gray-500">{item.batches.length} batches</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(item.totalValue)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  item.totalStock === 0 
                                    ? 'text-red-600 bg-red-50' 
                                    : item.lowStock 
                                      ? 'text-yellow-600 bg-yellow-50' 
                                      : 'text-green-600 bg-green-50'
                                }`}>
                                  {item.totalStock === 0 ? 'Out of Stock' : item.lowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                                {item.expiringSoon && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-50">
                                    Expiring Soon
                                  </span>
                                )}
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
            {pagination.totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="flex items-center space-x-1"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
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
                        disabled={!pagination.hasNext}
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