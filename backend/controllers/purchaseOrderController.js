const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendors');
const { generatePurchaseOrderNumber } = require('../utils/sequenceGenerator');
const { sendPurchaseOrderNotifications } = require('../utils/twilioIntegration');

// Create a new purchase order
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      vendorId,
      orderDate,
      expectedDelivery,
      priority = 'Normal',
      status = 'Draft',
      items,
      notes = '',
      terms = '',
      notifications = { whatsapp: false, email: false }
    } = req.body;

    // Validate required fields (orderNumber is now auto-generated)
    if (!vendorId || !orderDate || !expectedDelivery || !items || items.length === 0) {
      return res.status(400).json({
        message: 'Missing required fields: vendorId, orderDate, expectedDelivery, and items are required'
      });
    }

    // Generate auto-incrementing order number
    const orderNumber = await generatePurchaseOrderNumber();

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate total amount
    let totalAmount = 0;
    const processedItems = items.map(item => {
      if (!item.productName || item.quantity <= 0 || item.estimatedRate < 0) {
        throw new Error('Invalid item data: productName, quantity > 0, and estimatedRate >= 0 are required');
      }
      
      const amount = item.quantity * item.estimatedRate;
      totalAmount += amount;
      
      return {
        productName: item.productName.trim(),
        description: item.description?.trim() || '',
        quantity: item.quantity,
        estimatedRate: item.estimatedRate,
        expectedDelivery: item.expectedDelivery ? new Date(item.expectedDelivery) : null,
        notes: item.notes?.trim() || '',
        amount: amount
      };
    });

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      orderNumber: orderNumber.trim(),
      vendor_id: vendorId,
      orderDate: new Date(orderDate),
      expectedDelivery: new Date(expectedDelivery),
      priority,
      status,
      items: processedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      notes: notes.trim(),
      terms: terms.trim()
    });

    const savedPurchaseOrder = await purchaseOrder.save();

    // Return purchase order with populated vendor data
    const completePurchaseOrder = await PurchaseOrder.findById(savedPurchaseOrder._id)
      .populate('vendor_id', 'vendor_name phone email address gst_number payment_terms');

    let notificationResults = null;

    // Send notifications if requested
    if (notifications.whatsapp || notifications.email) {
      try {
        console.log('Sending notifications:', notifications);
        notificationResults = await sendPurchaseOrderNotifications(completePurchaseOrder, notifications);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the entire request if notifications fail
      }
    }

    res.status(201).json({
      purchaseOrder: completePurchaseOrder,
      message: 'Purchase order created successfully',
      notifications: notificationResults
    });

  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
};

// Get all purchase orders
const getPurchaseOrders = async (req, res) => {
  try {
    const { status, vendor, priority } = req.query;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (vendor) {
      filter.vendor_id = vendor;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('vendor_id', 'vendor_name phone email address')
      .sort({ createdAt: -1 });

    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
  }
};

// Get purchase order by ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('vendor_id', 'vendor_name phone email address gst_number payment_terms');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ message: 'Error fetching purchase order', error: error.message });
  }
};

// Update purchase order status
const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Draft', 'Sent', 'Confirmed', 'Partially_Received', 'Received', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    // Find and update the purchase order
    const updateData = { status };
    
    // Set appropriate date fields based on status
    if (status === 'Sent' && !req.body.sentDate) {
      updateData.sentDate = new Date();
    }
    if (status === 'Confirmed' && !req.body.confirmedDate) {
      updateData.confirmedDate = new Date();
    }
    if (status === 'Received' && !req.body.receivedDate) {
      updateData.receivedDate = new Date();
    }

    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('vendor_id', 'vendor_name');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json({ 
      message: 'Purchase order status updated successfully',
      purchaseOrder: {
        _id: purchaseOrder._id,
        orderNumber: purchaseOrder.orderNumber,
        status: purchaseOrder.status,
        vendor_name: purchaseOrder.vendor_id.vendor_name,
        totalAmount: purchaseOrder.totalAmount
      }
    });
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ message: 'Error updating purchase order status', error: error.message });
  }
};

// Update purchase order
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      orderNumber,
      vendorId,
      orderDate,
      expectedDelivery,
      priority,
      items,
      notes,
      terms
    } = req.body;

    // Find the existing purchase order
    const existingPO = await PurchaseOrder.findById(id);
    if (!existingPO) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Check if order can be updated (only Draft and Sent orders can be fully updated)
    if (!['Draft', 'Sent'].includes(existingPO.status)) {
      return res.status(400).json({ message: 'Cannot update purchase order in current status' });
    }

    // Verify vendor if changed
    if (vendorId && vendorId !== existingPO.vendor_id.toString()) {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
    }

    // Calculate new total if items changed
    let totalAmount = existingPO.totalAmount;
    let processedItems = existingPO.items;

    if (items && items.length > 0) {
      totalAmount = 0;
      processedItems = items.map(item => {
        if (!item.productName || item.quantity <= 0 || item.estimatedRate < 0) {
          throw new Error('Invalid item data: productName, quantity > 0, and estimatedRate >= 0 are required');
        }
        
        const amount = item.quantity * item.estimatedRate;
        totalAmount += amount;
        
        return {
          productName: item.productName.trim(),
          description: item.description?.trim() || '',
          quantity: item.quantity,
          estimatedRate: item.estimatedRate,
          expectedDelivery: item.expectedDelivery ? new Date(item.expectedDelivery) : null,
          notes: item.notes?.trim() || '',
          amount: amount
        };
      });
    }

    // Update purchase order
    const updatedData = {
      ...(orderNumber && { orderNumber: orderNumber.trim() }),
      ...(vendorId && { vendor_id: vendorId }),
      ...(orderDate && { orderDate: new Date(orderDate) }),
      ...(expectedDelivery && { expectedDelivery: new Date(expectedDelivery) }),
      ...(priority && { priority }),
      ...(items && { items: processedItems }),
      ...(items && { totalAmount: parseFloat(totalAmount.toFixed(2)) }),
      ...(notes !== undefined && { notes: notes.trim() }),
      ...(terms !== undefined && { terms: terms.trim() })
    };

    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('vendor_id', 'vendor_name phone email address');

    res.json({
      purchaseOrder: updatedPurchaseOrder,
      message: 'Purchase order updated successfully'
    });

  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Error updating purchase order', error: error.message });
  }
};

// Delete purchase order
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Only allow deletion of Draft orders
    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({ message: 'Cannot delete purchase order that has been sent or processed' });
    }

    await PurchaseOrder.findByIdAndDelete(id);

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Error deleting purchase order', error: error.message });
  }
};

// Get purchase order statistics
const getPurchaseOrderStats = async (req, res) => {
  try {
    const totalOrders = await PurchaseOrder.countDocuments();
    const draftOrders = await PurchaseOrder.countDocuments({ status: 'Draft' });
    const sentOrders = await PurchaseOrder.countDocuments({ status: 'Sent' });
    const confirmedOrders = await PurchaseOrder.countDocuments({ status: 'Confirmed' });
    const receivedOrders = await PurchaseOrder.countDocuments({ status: 'Received' });

    const totalValueResult = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalValue = totalValueResult.length > 0 ? totalValueResult[0].totalValue : 0;

    const stats = {
      totalOrders,
      draftOrders,
      sentOrders,
      confirmedOrders,
      receivedOrders,
      totalValue
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching purchase order stats:', error);
    res.status(500).json({ message: 'Error fetching purchase order stats', error: error.message });
  }
};

// Get next purchase order number for preview (without incrementing)
const getNextPurchaseOrderNumber = async (req, res) => {
  try {
    // Get current sequence without incrementing
    const Counter = require('../models/Counter');
    let currentSequence = 0;
    
    const counter = await Counter.findById('purchase_order');
    if (counter) {
      currentSequence = counter.sequence_value;
    }
    
    const nextSequence = currentSequence + 1;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    const nextOrderNumber = `PO-${year}-${month}-${String(nextSequence).padStart(4, '0')}`;
    res.json({ nextOrderNumber });
  } catch (error) {
    console.error('Error getting next purchase order number:', error);
    res.status(500).json({ message: 'Error getting next purchase order number', error: error.message });
  }
};

// Test notification services
const testNotificationServices = async (req, res) => {
  try {
    const { testTwilioConnection, testEmailConnection } = require('../utils/twilioIntegration');
    
    const twilioTest = await testTwilioConnection();
    const emailTest = await testEmailConnection();

    res.json({
      twilio: twilioTest,
      email: emailTest
    });
  } catch (error) {
    console.error('Error testing notification services:', error);
    res.status(500).json({ message: 'Error testing notification services', error: error.message });
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats,
  getNextPurchaseOrderNumber,
  testNotificationServices
};