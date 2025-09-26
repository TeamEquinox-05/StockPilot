const mongoose = require('mongoose');

const productBatchSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
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
  tax_rate: {
    type: Number,
    default: 0,
    min: 0
  },
  quantity_in_stock: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Add indexes for better performance
productBatchSchema.index({ product_id: 1, batch_number: 1 });
productBatchSchema.index({ barcode: 1 });

const Product_batches = mongoose.model('Product_batches', productBatchSchema);

module.exports = Product_batches;