const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  sale_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  batch_number: {
    type: String,
    required: true
  },
  barcode: {
    type: String,
    required: false,
    default: ''
  },
  quantity_sold: {
    type: Number,
    required: true,
    min: 1
  },
  selling_price: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  expiry_date: {
    type: Date
  }
});

module.exports = mongoose.model('SaleItem', saleItemSchema);