const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getPurchaseById
} = require('../controllers/purchaseController');

// Routes for purchases
router.post('/', createPurchase);        // POST /api/purchases - Create new purchase
router.get('/', getPurchases);           // GET /api/purchases - Get all purchases  
router.get('/:id', getPurchaseById);     // GET /api/purchases/:id - Get purchase by ID

module.exports = router;