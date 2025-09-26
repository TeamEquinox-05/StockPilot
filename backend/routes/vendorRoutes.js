const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
} = require('../controllers/vendorController');

// Routes for vendors
router.get('/', getVendors);           // GET /api/vendors - Get all vendors
router.get('/:id', getVendorById);     // GET /api/vendors/:id - Get vendor by ID
router.post('/', createVendor);        // POST /api/vendors - Create new vendor
router.put('/:id', updateVendor);      // PUT /api/vendors/:id - Update vendor
router.delete('/:id', deleteVendor);   // DELETE /api/vendors/:id - Delete vendor

module.exports = router;