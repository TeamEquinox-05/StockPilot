const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePaymentStatus
} = require('../controllers/purchaseController');

// Routes for purchases
router.post('/', createPurchase);        // POST /api/purchases - Create new purchase
router.get('/', getPurchases);           // GET /api/purchases - Get all purchases  
router.get('/:id', getPurchaseById);     // GET /api/purchases/:id - Get purchase by ID
router.patch('/:id/payment-status', updatePaymentStatus); // PATCH /api/purchases/:id/payment-status - Update payment status

module.exports = router;