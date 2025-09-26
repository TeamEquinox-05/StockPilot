const Counter = require('../models/Counter');

const getNextSequence = async (name) => {
  try {
    // Use findOneAndUpdate with upsert to handle concurrent requests better
    const counter = await Counter.findOneAndUpdate(
      { _id: name },
      { $inc: { sequence_value: 1 } },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );
    return counter.sequence_value;
  } catch (error) {
    // If there's a race condition, try once more
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      return counter.sequence_value;
    } catch (retryError) {
      throw new Error(`Error generating sequence for ${name}: ${retryError.message}`);
    }
  }
};

const generatePurchaseOrderNumber = async () => {
  try {
    const sequence = await getNextSequence('purchase_order');
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Format: PO-YYYY-MM-XXXX (e.g., PO-2025-09-0001)
    const orderNumber = `PO-${year}-${month}-${String(sequence).padStart(4, '0')}`;
    return orderNumber;
  } catch (error) {
    throw new Error(`Error generating purchase order number: ${error.message}`);
  }
};

module.exports = {
  getNextSequence,
  generatePurchaseOrderNumber
};