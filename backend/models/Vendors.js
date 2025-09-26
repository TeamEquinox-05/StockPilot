const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendor_name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  gst_number: {
    type: String,
    trim: true,
    default: ''
  },
  payment_terms: {
    type: String,
    enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate'],
    default: 'Net 30'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add index for better search performance
vendorSchema.index({ vendor_name: 1, email: 1 });

const Vendors = mongoose.model('Vendors', vendorSchema);

module.exports = Vendors;