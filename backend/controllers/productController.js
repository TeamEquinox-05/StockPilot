const Product = require('../models/Products');
const ProductBatch = require('../models/Product_batches');
const PurchaseItem = require('../models/Purchase_items');

// Search products with latest purchase details
const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json([]);
    }

    // Find products matching search term
    const products = await Product.find({
      product_name: { $regex: search, $options: 'i' }
    }).limit(10);

    // For each product, get the latest batch and purchase details
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        // Get the latest batch for this product
        const latestBatch = await ProductBatch.findOne({ 
          product_id: product._id 
        }).sort({ createdAt: -1 });

        if (!latestBatch) {
          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            isNewProduct: false,
            latestDetails: null
          };
        }

        // Get latest purchase details for this batch
        const latestPurchaseItem = await PurchaseItem.findOne({ 
          batch_id: latestBatch._id 
        }).sort({ createdAt: -1 });

        return {
          _id: product._id,
          product_name: product.product_name,
          category: product.category,
          hsn_code: product.hsn_code,
          description: product.description,
          isNewProduct: false,
          latestDetails: {
            batch_number: latestBatch.batch_number,
            barcode: latestBatch.barcode,
            mrp: latestBatch.mrp,
            expiry_date: latestBatch.expiry_date,
            purchase_rate: latestPurchaseItem?.purchase_rate || 0,
            tax_percent: latestPurchaseItem?.tax_percent || 0,
            discount_percent: latestPurchaseItem?.discount_percent || 0
          }
        };
      })
    );

    res.json(productsWithDetails);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

// Get all unique categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const filteredCategories = categories.filter(cat => cat && cat.trim()).sort();
    res.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get batches for a specific product
const getProductBatches = async (req, res) => {
  try {
    const { productId } = req.params;
    const { search } = req.query;

    let query = { product_id: productId };
    
    // If search term provided, filter by batch number
    if (search && search.trim()) {
      query.batch_number = { $regex: search.trim(), $options: 'i' };
    }

    const batches = await ProductBatch.find(query)
      .select('batch_number barcode mrp expiry_date')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(batches);
  } catch (error) {
    console.error('Error fetching product batches:', error);
    res.status(500).json({ message: 'Error fetching product batches', error: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const { product_name, category, hsn_code, description } = req.body;

    if (!product_name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ 
      product_name: { $regex: `^${product_name.trim()}$`, $options: 'i' }
    });

    if (existingProduct) {
      return res.status(409).json({ message: 'Product already exists' });
    }

    const product = new Product({
      product_name: product_name.trim(),
      category: category?.trim() || '',
      hsn_code: hsn_code?.trim() || '',
      description: description?.trim() || ''
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ product_name: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get paginated inventory data with stock calculations
const getInventoryPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const stockFilter = req.query.stockFilter || 'all';

    // Build search query
    let productQuery = {};
    if (search) {
      productQuery.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { hsn_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      productQuery.category = category;
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(productQuery);
    
    // Get products for current page
    const products = await Product.find(productQuery)
      .sort({ product_name: 1 })
      .skip(skip)
      .limit(limit);

    // Get inventory data with stock calculations
    const inventoryData = await Promise.all(
      products.map(async (product) => {
        try {
          // Get all batches for this product
          const batches = await ProductBatch.find({ product_id: product._id });
          
          // Calculate totals
          const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
          const totalValue = batches.reduce((sum, batch) => 
            sum + ((batch.quantity_in_stock || 0) * (batch.mrp || 0)), 0);
          
          // Check stock status
          const lowStock = totalStock > 0 && totalStock < 10;
          const outOfStock = totalStock === 0;
          
          // Check for expiring soon (within 30 days)
          const expiringSoon = batches.some(batch => {
            if (!batch.expiry_date || (batch.quantity_in_stock || 0) === 0) return false;
            const expiryDate = new Date(batch.expiry_date);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
          });

          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            batches: batches.map(batch => ({
              _id: batch._id,
              batch_number: batch.batch_number,
              barcode: batch.barcode,
              expiry_date: batch.expiry_date,
              mrp: batch.mrp,
              tax_rate: batch.tax_rate,
              quantity_in_stock: batch.quantity_in_stock,
              createdAt: batch.createdAt
            })),
            totalStock,
            totalValue,
            lowStock,
            expiringSoon
          };
        } catch (error) {
          console.error(`Error processing product ${product._id}:`, error);
          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            batches: [],
            totalStock: 0,
            totalValue: 0,
            lowStock: false,
            expiringSoon: false
          };
        }
      })
    );

    // Apply stock filter if needed
    let filteredData = inventoryData;
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'in-stock':
          filteredData = inventoryData.filter(item => item.totalStock > 0);
          break;
        case 'low':
          filteredData = inventoryData.filter(item => item.lowStock);
          break;
        case 'out-of-stock':
          filteredData = inventoryData.filter(item => item.totalStock === 0);
          break;
        case 'expiring':
          filteredData = inventoryData.filter(item => item.expiringSoon);
          break;
      }
    }

    // Calculate statistics for the entire dataset (not just current page)
    const allProducts = await Product.find({});
    const stats = {
      totalProducts: allProducts.length,
      totalStock: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringSoonItems: 0
    };

    // Quick stats calculation (you might want to cache this)
    for (const product of allProducts.slice(0, 50)) { // Sample first 50 for performance
      try {
        const batches = await ProductBatch.find({ product_id: product._id });
        const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
        const totalValue = batches.reduce((sum, batch) => 
          sum + ((batch.quantity_in_stock || 0) * (batch.mrp || 0)), 0);
        
        stats.totalStock += totalStock;
        stats.totalValue += totalValue;
        if (totalStock === 0) stats.outOfStockItems++;
        else if (totalStock < 10) stats.lowStockItems++;
      } catch (error) {
        console.error(`Error calculating stats for product ${product._id}:`, error);
      }
    }

    res.json({
      items: filteredData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
        hasNext: page < Math.ceil(totalProducts / limit),
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ message: 'Error fetching inventory data', error: error.message });
  }
};

// Get products with latest purchase pricing for purchase orders
const getProductsWithPricing = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ product_name: 1 });

    // For each product, get the latest purchase details
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        // Get the latest purchase item for this product
        const latestPurchaseItem = await PurchaseItem.findOne()
          .populate({
            path: 'batch_id',
            match: { product_id: product._id },
            select: 'product_id'
          })
          .sort({ createdAt: -1 })
          .exec();

        // Calculate average purchase rate from all purchase items for this product
        const purchaseItems = await PurchaseItem.find()
          .populate({
            path: 'batch_id',
            match: { product_id: product._id }
          })
          .exec();

        const validItems = purchaseItems.filter(item => item.batch_id);
        const avgPurchaseRate = validItems.length > 0 
          ? validItems.reduce((sum, item) => sum + item.purchase_rate, 0) / validItems.length 
          : 0;

        return {
          _id: product._id,
          product_name: product.product_name,
          category: product.category,
          hsn_code: product.hsn_code,
          description: product.description,
          latestPurchaseRate: latestPurchaseItem?.purchase_rate || 0,
          latestTaxRate: latestPurchaseItem?.tax_percent || 0,
          avgPurchaseRate: avgPurchaseRate
        };
      })
    );

    res.json(productsWithPricing);
  } catch (error) {
    console.error('Error fetching products with pricing:', error);
    res.status(500).json({ message: 'Error fetching products with pricing', error: error.message });
  }
};





module.exports = {
  searchProducts,
  createProduct,
  getProducts,
  getProductBatches,
  getProductsWithPricing,
  getInventoryPaginated,
  getCategories
};