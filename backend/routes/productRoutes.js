const express = require('express');
const router = express.Router();
const {
  searchProducts,
  createProduct,
  getProducts,
  getProductBatches,
  getProductsWithPricing,
  getLowStockProducts
} = require('../controllers/productController');

// Routes for products
router.get('/search', searchProducts);           // GET /api/products/search?search=term
router.get('/low-stock', getLowStockProducts);   // GET /api/products/low-stock?threshold=5 - Get products with low stock
router.get('/with-pricing', getProductsWithPricing); // GET /api/products/with-pricing - Get products with latest pricing
router.get('/:productId/batches', getProductBatches); // GET /api/products/:productId/batches?search=term
router.get('/', getProducts);                    // GET /api/products
router.post('/', createProduct);                 // POST /api/products

module.exports = router;