const Product = require('../models/Product');
const ProductBatch = require('../models/ProductBatch');
const PurchaseItem = require('../models/PurchaseItem');

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

module.exports = {
  searchProducts,
  createProduct,
  getProducts
};