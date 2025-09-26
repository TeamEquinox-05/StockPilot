const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Product = require('../models/Product');
const ProductBatch = require('../models/ProductBatch');
const Vendor = require('../models/Vendor');

// Create complete purchase with items and batches
const createPurchase = async (req, res) => {
  try {
    const { vendor_name, bill_no, purchase_date, items, payment_status = 'Pending' } = req.body;

    if (!vendor_name || !bill_no || !purchase_date || !items || items.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: vendor_name, bill_no, purchase_date, and items are required' 
      });
    }

    // Find vendor by name
    const vendor = await Vendor.findOne({ vendor_name: vendor_name });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate total amount
    let total_amount = 0;
    const processedItems = [];

    // Process each item
    for (const item of items) {
      const { name, batch, barcode, expiryDate, qty, purchaseRate, tax, mrp, discount } = item;

      if (!name || !batch || qty <= 0 || purchaseRate < 0) {
        return res.status(400).json({ 
          message: 'Invalid item data: name, batch, quantity > 0, and purchaseRate >= 0 are required' 
        });
      }

      // Find or create product
      let product = await Product.findOne({ 
        product_name: { $regex: `^${name.trim()}$`, $options: 'i' }
      });

      if (!product) {
        product = new Product({
          product_name: name.trim(),
          category: '',
          hsn_code: '',
          description: ''
        });
        await product.save();
      }

      // Find or create product batch
      let productBatch = await ProductBatch.findOne({
        product_id: product._id,
        batch_number: batch.trim()
      });

      if (!productBatch) {
        productBatch = new ProductBatch({
          product_id: product._id,
          batch_number: batch.trim(),
          barcode: barcode || '',
          expiry_date: expiryDate ? new Date(expiryDate) : null,
          mrp: mrp || 0,
          tax_rate: tax || 0,
          quantity_in_stock: 0
        });
        await productBatch.save();
      } else {
        // Update fields if provided
        if (mrp && mrp > 0) {
          productBatch.mrp = mrp;
        }
        if (tax) {
          productBatch.tax_rate = tax;
        }
        if (barcode) {
          productBatch.barcode = barcode;
        }
        if (expiryDate) {
          productBatch.expiry_date = new Date(expiryDate);
        }
        await productBatch.save();
      }

      // Calculate item amount
      const base = qty * purchaseRate;
      const discountAmount = base * (discount / 100);
      const taxAmount = (base - discountAmount) * (tax / 100);
      const itemAmount = base - discountAmount + taxAmount;
      total_amount += itemAmount;

      processedItems.push({
        batch_id: productBatch._id,
        quantity: qty,
        purchase_rate: purchaseRate,
        tax_percent: tax,
        discount_percent: discount
      });

      // Update stock quantity
      productBatch.quantity_in_stock += qty;
      await productBatch.save();
    }

    // Create purchase record
    const purchase = new Purchase({
      vendor_id: vendor._id,
      bill_no: bill_no.trim(),
      purchase_date: new Date(purchase_date),
      total_amount: parseFloat(total_amount.toFixed(2)),
      payment_status: payment_status
    });

    const savedPurchase = await purchase.save();

    // Create purchase items
    const purchaseItems = [];
    for (const itemData of processedItems) {
      const purchaseItem = new PurchaseItem({
        purchase_id: savedPurchase._id,
        ...itemData
      });
      const savedItem = await purchaseItem.save();
      purchaseItems.push(savedItem);
    }

    // Return complete purchase with populated data
    const completePurchase = await Purchase.findById(savedPurchase._id)
      .populate('vendor_id', 'vendor_name phone email');

    res.status(201).json({
      purchase: completePurchase,
      items: purchaseItems,
      message: 'Purchase created successfully'
    });

  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Error creating purchase', error: error.message });
  }
};

// Get all purchases
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({})
      .populate('vendor_id', 'vendor_name phone email')
      .sort({ purchase_date: -1 });
    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Error fetching purchases', error: error.message });
  }
};

// Get purchase by ID with items
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('vendor_id', 'vendor_name phone email');
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const items = await PurchaseItem.find({ purchase_id: purchase._id })
      .populate({
        path: 'batch_id',
        populate: {
          path: 'product_id',
          select: 'product_name category'
        }
      });

    res.json({ purchase, items });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ message: 'Error fetching purchase', error: error.message });
  }
};

// Update payment status for an existing purchase
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    // Validate payment status
    if (!['Pending', 'Paid', 'Partial'].includes(payment_status)) {
      return res.status(400).json({ 
        message: 'Invalid payment status. Must be one of: Pending, Paid, Partial' 
      });
    }

    // Find and update the purchase
    const purchase = await Purchase.findByIdAndUpdate(
      id,
      { payment_status },
      { new: true, runValidators: true }
    ).populate('vendor_id', 'vendor_name');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({ 
      message: 'Payment status updated successfully',
      purchase: {
        _id: purchase._id,
        bill_no: purchase.bill_no,
        payment_status: purchase.payment_status,
        vendor_name: purchase.vendor_id.vendor_name,
        total_amount: purchase.total_amount
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Get recent purchase activity for dashboard
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Get recent purchases sorted by creation date (most recent first)
    const recentPurchases = await Purchase.find({})
      .populate('vendor_id', 'vendor_name')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Format the activity data
    const activities = recentPurchases.map(purchase => {
      const timeDiff = new Date() - new Date(purchase.createdAt);
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      let timeAgo;
      if (days > 0) {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }

      let activityType, icon, iconColor;
      if (purchase.payment_status === 'Paid') {
        activityType = 'completed';
        icon = '✅';
        iconColor = 'green';
      } else if (purchase.payment_status === 'Pending') {
        activityType = 'pending';
        icon = '⏳';
        iconColor = 'orange';
      } else {
        activityType = 'partial';
        icon = '💰';
        iconColor = 'blue';
      }

      return {
        id: purchase._id,
        type: activityType,
        title: `Purchase #${purchase.bill_no} ${purchase.payment_status === 'Paid' ? 'completed' : 'created'}`,
        description: `Vendor: ${purchase.vendor_id.vendor_name} • Amount: ₹${purchase.total_amount.toLocaleString()}`,
        icon,
        iconColor,
        timeAgo,
        amount: purchase.total_amount,
        vendor: purchase.vendor_id.vendor_name,
        payment_status: purchase.payment_status
      };
    });

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
  }
};

// Get purchase statistics for dashboard
const getPurchaseStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get this month's purchase total and details
    const thisMonthPurchases = await Purchase.aggregate([
      {
        $match: {
          purchase_date: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total_amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$total_amount' }
        }
      }
    ]);

    // Get completed orders count (paid status)
    const completedOrders = await Purchase.countDocuments({ payment_status: 'Paid' });
    
    // Get pending orders count (pending or partial status)  
    const pendingOrders = await Purchase.countDocuments({ 
      payment_status: { $in: ['Pending', 'Partial'] } 
    });

    // Get total pending amount for pending/partial orders
    const pendingAmount = await Purchase.aggregate([
      {
        $match: {
          payment_status: { $in: ['Pending', 'Partial'] }
        }
      },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: '$total_amount' }
        }
      }
    ]);

    // Get total purchases count
    const totalOrders = await Purchase.countDocuments({});

    const stats = {
      thisMonthAmount: thisMonthPurchases.length > 0 ? thisMonthPurchases[0].totalAmount : 0,
      thisMonthCount: thisMonthPurchases.length > 0 ? thisMonthPurchases[0].count : 0,
      avgPurchaseAmount: thisMonthPurchases.length > 0 ? thisMonthPurchases[0].avgAmount : 0,
      completedOrders,
      pendingOrders,
      pendingAmount: pendingAmount.length > 0 ? pendingAmount[0].totalPendingAmount : 0,
      totalOrders
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching purchase stats:', error);
    res.status(500).json({ message: 'Error fetching purchase stats', error: error.message });
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePaymentStatus,
  getRecentActivity,
  getPurchaseStats
};