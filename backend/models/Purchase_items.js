const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  purchase_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchases',
    required: true
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product_batches',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  purchase_rate: {
    type: Number,
    required: true,
    min: 0
  },
  tax_percent: {
    type: Number,
    required: true,
    min: 0
  },
  discount_percent: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Add indexes
purchaseItemSchema.index({ purchase_id: 1 });
purchaseItemSchema.index({ batch_id: 1 });

const Purchase_items = mongoose.model('Purchase_items', purchaseItemSchema);

module.exports = Purchase_items;