const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  bill_no: {
    type: String,
    required: true,
    trim: true
  },
  purchase_date: {
    type: Date,
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Add indexes
purchaseSchema.index({ vendor_id: 1, purchase_date: -1 });
purchaseSchema.index({ bill_no: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;