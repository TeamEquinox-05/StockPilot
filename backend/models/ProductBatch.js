const mongoose = require('mongoose');

const productBatchSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batch_number: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    default: ''
  },
  expiry_date: {
    type: Date,
    default: null
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  quantity_in_stock: {
    type: Number,
    default: 0,
    min: 0
  },
  // Additional fields for purchase tracking
  latest_purchase_rate: {
    type: Number,
    default: 0
  },
  latest_tax_percent: {
    type: Number,
    default: 0
  },
  latest_discount_percent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes for better performance
productBatchSchema.index({ product_id: 1, batch_number: 1 });
productBatchSchema.index({ barcode: 1 });

const ProductBatch = mongoose.model('ProductBatch', productBatchSchema);

module.exports = ProductBatch;