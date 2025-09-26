const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  hsn_code: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Add index for better search performance
productSchema.index({ product_name: 1, category: 1 });

const Products = mongoose.model('Products', productSchema);

module.exports = Products;