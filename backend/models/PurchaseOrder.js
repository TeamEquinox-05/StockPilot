const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedRate: {
    type: Number,
    required: true,
    min: 0
  },
  expectedDelivery: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendors',
    required: true
  },
  orderDate: {
    type: Date,
    required: true
  },
  expectedDelivery: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Confirmed', 'Partially_Received', 'Received', 'Cancelled'],
    default: 'Draft'
  },
  items: [purchaseOrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  terms: {
    type: String,
    trim: true,
    default: ''
  },
  sentDate: {
    type: Date
  },
  confirmedDate: {
    type: Date
  },
  receivedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes
purchaseOrderSchema.index({ vendor_id: 1, orderDate: -1 });
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ status: 1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;