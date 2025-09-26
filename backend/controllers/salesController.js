const ProductBatch = require('../models/ProductBatch');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');

// Search products for sales
const searchProductsForSales = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(search, 'i');
    
    // First find products that match the search term
    const Product = require('../models/Product');
    const matchingProducts = await Product.find({
      product_name: { $regex: searchRegex }
    });

    const productIds = matchingProducts.map(p => p._id);

    // Then find product batches for those products or by barcode
    const productBatches = await ProductBatch.find({
      $and: [
        { quantity_in_stock: { $gt: 0 } }, // Only products with stock
        {
          $or: [
            { product_id: { $in: productIds } }, // Match by product ID
            { barcode: { $regex: searchRegex } } // Or by barcode
          ]
        }
      ]
    }).populate('product_id', 'product_name').sort({ 'product_id.product_name': 1 }).limit(10);

    // Transform the data to include product_name directly
    const transformedProducts = productBatches.map(batch => ({
      _id: batch._id,
      product_name: batch.product_id.product_name,
      batch_number: batch.batch_number,
      barcode: batch.barcode,
      expiry_date: batch.expiry_date,
      mrp: batch.mrp,
      tax_rate: batch.tax_rate,
      quantity_in_stock: batch.quantity_in_stock,
      purchase_rate: 0 // Not needed for sales
    }));

    res.json(transformedProducts);
  } catch (error) {
    console.error('Error searching products for sales:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

// Create new sale
const createSale = async (req, res) => {
  try {
    const { date, customerName, customerPhone, customerEmail, billNo, items, subtotal, discountPercentage, discountAmount, tax, total, paymentMethod } = req.body;

    // Validate required fields
    if (!date || !items || items.length === 0) {
      return res.status(400).json({ error: 'Date and items are required' });
    }

    // Check stock availability for all items
    for (const item of items) {
      const productBatch = await ProductBatch.findOne({
        batch_number: item.batch,
        barcode: item.barcode || ''
      }).populate('product_id', 'product_name');

      if (!productBatch || productBatch.product_id.product_name !== item.name) {
        return res.status(400).json({ error: `Product batch not found: ${item.name} - ${item.batch}` });
      }

      if (productBatch.quantity_in_stock < item.qty) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.name}. Available: ${productBatch.quantity_in_stock}, Required: ${item.qty}` 
        });
      }
    }

    // Create sale
    const sale = new Sale({
      date: new Date(date),
      customer_name: customerName || 'Cash Customer',
      customer_phone: customerPhone || '',
      customer_email: customerEmail || '',
      bill_no: billNo || Date.now().toString(),
      subtotal: subtotal || 0,
      discount_percentage: discountPercentage || 0,
      discount_amount: discountAmount || 0,
      tax: tax || 0,
      total: total,
      payment_method: paymentMethod || 'CARD',
      created_at: new Date()
    });

    const savedSale = await sale.save();

    // Create sale items and update stock
    for (const item of items) {
      // Create sale item
      const saleItem = new SaleItem({
        sale_id: savedSale._id,
        product_name: item.name,
        batch_number: item.batch,
        barcode: item.barcode || '',
        quantity_sold: item.qty,
        selling_price: item.sellingPrice,
        mrp: item.mrp,
        discount_percentage: item.discount,
        amount: item.amount,
        expiry_date: item.expiryDate ? new Date(item.expiryDate) : undefined
      });

      await saleItem.save();

      // Update stock
      await ProductBatch.findOneAndUpdate(
        {
          batch_number: item.batch,
          barcode: item.barcode || ''
        },
        {
          $inc: { quantity_in_stock: -item.qty }
        }
      );
    }

    res.status(201).json({
      message: 'Sale created successfully',
      sale: savedSale
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
};

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ created_at: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// Get sale by ID with items
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const saleItems = await SaleItem.find({ sale_id: id });
    
    res.json({
      sale,
      items: saleItems
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
};

// Get next auto-incrementing bill number
const getNextBillNumber = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Find the latest bill number for today
    const latestSale = await Sale.findOne({
      bill_no: { $regex: `^BILL-${datePrefix}-` }
    }).sort({ bill_no: -1 });

    let nextNumber = 1;
    if (latestSale) {
      // Extract the number from the last bill and increment
      const lastBillParts = latestSale.bill_no.split('-');
      if (lastBillParts.length === 3) {
        const lastNumber = parseInt(lastBillParts[2]);
        nextNumber = lastNumber + 1;
      }
    }

    const billNumber = `BILL-${datePrefix}-${String(nextNumber).padStart(4, '0')}`;
    res.json({ billNumber });
  } catch (error) {
    console.error('Error generating bill number:', error);
    res.status(500).json({ error: 'Failed to generate bill number' });
  }
};

// Debug endpoint to check products in database
const debugProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    const productBatches = await ProductBatch.find({}).populate('product_id', 'product_name');
    
    res.json({
      products: products,
      productBatches: productBatches.map(batch => ({
        _id: batch._id,
        product_name: batch.product_id?.product_name || 'Unknown',
        batch_number: batch.batch_number,
        barcode: batch.barcode,
        quantity_in_stock: batch.quantity_in_stock,
        mrp: batch.mrp,
        tax_rate: batch.tax_rate
      }))
    });
  } catch (error) {
    console.error('Error debugging products:', error);
    res.status(500).json({ error: 'Failed to debug products' });
  }
};

module.exports = {
  searchProductsForSales,
  createSale,
  getAllSales,
  getSaleById,
  getNextBillNumber,
  debugProducts
};