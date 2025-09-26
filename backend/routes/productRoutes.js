const express = require('express');
const router = express.Router();
const {
  searchProducts,
  createProduct,
  getProducts,
  getProductBatches
} = require('../controllers/productController');

// Routes for products
router.get('/search', searchProducts);           // GET /api/products/search?search=term
router.get('/:productId/batches', getProductBatches); // GET /api/products/:productId/batches?search=term
router.get('/', getProducts);                    // GET /api/products
router.post('/', createProduct);                 // POST /api/products

module.exports = router;