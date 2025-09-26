const express = require('express');
const router = express.Router();
const {
  searchProductsForSales,
  createSale,
  getAllSales,
  getSaleById,
  getNextBillNumber,
  debugProducts
} = require('../controllers/salesController');

// Get next auto-incrementing bill number
router.get('/next-bill-number', getNextBillNumber);

// Search products for sales (with stock availability)
router.get('/search-products', searchProductsForSales);

// Create new sale
router.post('/', createSale);

// Debug endpoint to check products
router.get('/debug/products', debugProducts);

// Get all sales
router.get('/', getAllSales);

// Get sale by ID with items
router.get('/:id', getSaleById);

module.exports = router;