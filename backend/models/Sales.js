const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  customer_name: {
    type: String,
    default: 'Cash Customer'
  },
  customer_phone: {
    type: String,
    default: ''
  },
  customer_email: {
    type: String,
    default: ''
  },
  bill_no: {
    type: String,
    required: true,
    unique: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI'],
    default: 'CARD'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sales', saleSchema);