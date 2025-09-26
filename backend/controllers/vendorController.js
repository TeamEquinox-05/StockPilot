const Vendor = require('../models/Vendor');

// Get all vendors
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({}).sort({ vendor_name: 1 });
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
};

// Get vendor by ID
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Error fetching vendor', error: error.message });
  }
};

// Create new vendor
const createVendor = async (req, res) => {
  try {
    const { vendor_name, phone, email, address, gst_number, payment_terms } = req.body;

    // Validate required fields
    if (!vendor_name || !phone || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields: vendor_name, phone, and email are required' 
      });
    }

    // Check if vendor with same email already exists
    const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (existingVendor) {
      return res.status(409).json({ message: 'Vendor with this email already exists' });
    }

    // Create new vendor
    const vendor = new Vendor({
      vendor_name: vendor_name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      address: address ? address.trim() : '',
      gst_number: gst_number ? gst_number.trim() : '',
      payment_terms: payment_terms || 'Net 30'
    });

    const savedVendor = await vendor.save();
    res.status(201).json(savedVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error creating vendor', error: error.message });
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const { vendor_name, phone, email, address, gst_number, payment_terms } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.toLowerCase() !== vendor.email) {
      const existingVendor = await Vendor.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      if (existingVendor) {
        return res.status(409).json({ message: 'Vendor with this email already exists' });
      }
    }

    // Update vendor fields
    if (vendor_name) vendor.vendor_name = vendor_name.trim();
    if (phone) vendor.phone = phone.trim();
    if (email) vendor.email = email.toLowerCase().trim();
    if (address !== undefined) vendor.address = address.trim();
    if (gst_number !== undefined) vendor.gst_number = gst_number.trim();
    if (payment_terms) vendor.payment_terms = payment_terms;

    const updatedVendor = await vendor.save();
    res.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error updating vendor', error: error.message });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Error deleting vendor', error: error.message });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
};