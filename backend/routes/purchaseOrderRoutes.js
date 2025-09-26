const express = require('express');
const router = express.Router();
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats,
  getNextPurchaseOrderNumber
} = require('../controllers/purchaseOrderController');

// Routes for purchase orders
router.post('/', createPurchaseOrder);                    // POST /api/purchase-orders - Create new purchase order
router.get('/', getPurchaseOrders);                       // GET /api/purchase-orders - Get all purchase orders
router.get('/next-number', getNextPurchaseOrderNumber);   // GET /api/purchase-orders/next-number - Get next order number
router.get('/stats', getPurchaseOrderStats);              // GET /api/purchase-orders/stats - Get purchase order statistics
router.get('/:id', getPurchaseOrderById);                 // GET /api/purchase-orders/:id - Get purchase order by ID
router.put('/:id', updatePurchaseOrder);                  // PUT /api/purchase-orders/:id - Update purchase order
router.patch('/:id/status', updatePurchaseOrderStatus);   // PATCH /api/purchase-orders/:id/status - Update status only
router.delete('/:id', deletePurchaseOrder);               // DELETE /api/purchase-orders/:id - Delete purchase order

module.exports = router;