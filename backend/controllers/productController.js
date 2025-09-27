const Product = require('../models/Products');
const ProductBatch = require('../models/Product_batches');
const PurchaseItem = require('../models/Purchase_items');
const SaleItem = require('../models/Sale_items');

// Search products with latest purchase details
const searchProducts = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 2) {
      return res.json([]);
    }

    // Find products matching search term
    const products = await Product.find({
      product_name: { $regex: search, $options: 'i' }
    }).limit(10);

    // For each product, get the latest batch and purchase details
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        // Get the latest batch for this product
        const latestBatch = await ProductBatch.findOne({ 
          product_id: product._id 
        }).sort({ createdAt: -1 });

        if (!latestBatch) {
          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            isNewProduct: false,
            latestDetails: null
          };
        }

        // Get latest purchase details for this batch
        const latestPurchaseItem = await PurchaseItem.findOne({ 
          batch_id: latestBatch._id 
        }).sort({ createdAt: -1 });

        return {
          _id: product._id,
          product_name: product.product_name,
          category: product.category,
          hsn_code: product.hsn_code,
          description: product.description,
          isNewProduct: false,
          latestDetails: {
            batch_number: latestBatch.batch_number,
            barcode: latestBatch.barcode,
            mrp: latestBatch.mrp,
            expiry_date: latestBatch.expiry_date,
            purchase_rate: latestPurchaseItem?.purchase_rate || 0,
            tax_percent: latestPurchaseItem?.tax_percent || 0,
            discount_percent: latestPurchaseItem?.discount_percent || 0
          }
        };
      })
    );

    res.json(productsWithDetails);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products', error: error.message });
  }
};

// Get all unique categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const filteredCategories = categories.filter(cat => cat && cat.trim()).sort();
    res.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get batches for a specific product
const getProductBatches = async (req, res) => {
  try {
    const { productId } = req.params;
    const { search } = req.query;

    let query = { product_id: productId };
    
    // If search term provided, filter by batch number
    if (search && search.trim()) {
      query.batch_number = { $regex: search.trim(), $options: 'i' };
    }

    const batches = await ProductBatch.find(query)
      .select('batch_number barcode mrp expiry_date')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(batches);
  } catch (error) {
    console.error('Error fetching product batches:', error);
    res.status(500).json({ message: 'Error fetching product batches', error: error.message });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const { product_name, category, hsn_code, description } = req.body;

    if (!product_name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ 
      product_name: { $regex: `^${product_name.trim()}$`, $options: 'i' }
    });

    if (existingProduct) {
      return res.status(409).json({ message: 'Product already exists' });
    }

    const product = new Product({
      product_name: product_name.trim(),
      category: category?.trim() || '',
      hsn_code: hsn_code?.trim() || '',
      description: description?.trim() || ''
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ product_name: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get paginated inventory data with stock calculations
const getInventoryPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const stockFilter = req.query.stockFilter || 'all';

    // Build search query
    let productQuery = {};
    if (search) {
      productQuery.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { hsn_code: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      productQuery.category = category;
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(productQuery);
    
    // Get products for current page
    const products = await Product.find(productQuery)
      .sort({ product_name: 1 })
      .skip(skip)
      .limit(limit);

    // Get inventory data with stock calculations
    const inventoryData = await Promise.all(
      products.map(async (product) => {
        try {
          // Get all batches for this product
          const batches = await ProductBatch.find({ product_id: product._id });
          
          // Calculate totals
          const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
          const totalValue = batches.reduce((sum, batch) => 
            sum + ((batch.quantity_in_stock || 0) * (batch.mrp || 0)), 0);
          
          // Check stock status
          const lowStock = totalStock > 0 && totalStock < 10;
          const outOfStock = totalStock === 0;
          
          // Check for expiring soon (within 30 days)
          const expiringSoon = batches.some(batch => {
            if (!batch.expiry_date || (batch.quantity_in_stock || 0) === 0) return false;
            const expiryDate = new Date(batch.expiry_date);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expiryDate <= thirtyDaysFromNow;
          });

          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            batches: batches.map(batch => ({
              _id: batch._id,
              batch_number: batch.batch_number,
              barcode: batch.barcode,
              expiry_date: batch.expiry_date,
              mrp: batch.mrp,
              tax_rate: batch.tax_rate,
              quantity_in_stock: batch.quantity_in_stock,
              createdAt: batch.createdAt
            })),
            totalStock,
            totalValue,
            lowStock,
            expiringSoon
          };
        } catch (error) {
          console.error(`Error processing product ${product._id}:`, error);
          return {
            _id: product._id,
            product_name: product.product_name,
            category: product.category,
            hsn_code: product.hsn_code,
            description: product.description,
            batches: [],
            totalStock: 0,
            totalValue: 0,
            lowStock: false,
            expiringSoon: false
          };
        }
      })
    );

    // Apply stock filter if needed
    let filteredData = inventoryData;
    if (stockFilter !== 'all') {
      switch (stockFilter) {
        case 'in-stock':
          filteredData = inventoryData.filter(item => item.totalStock > 0);
          break;
        case 'low':
          filteredData = inventoryData.filter(item => item.lowStock);
          break;
        case 'out-of-stock':
          filteredData = inventoryData.filter(item => item.totalStock === 0);
          break;
        case 'expiring':
          filteredData = inventoryData.filter(item => item.expiringSoon);
          break;
      }
    }

    // Calculate statistics for the entire dataset (not just current page)
    const allProducts = await Product.find({});
    const stats = {
      totalProducts: allProducts.length,
      totalStock: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringSoonItems: 0
    };

    // Quick stats calculation (you might want to cache this)
    for (const product of allProducts.slice(0, 50)) { // Sample first 50 for performance
      try {
        const batches = await ProductBatch.find({ product_id: product._id });
        const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
        const totalValue = batches.reduce((sum, batch) => 
          sum + ((batch.quantity_in_stock || 0) * (batch.mrp || 0)), 0);
        
        stats.totalStock += totalStock;
        stats.totalValue += totalValue;
        if (totalStock === 0) stats.outOfStockItems++;
        else if (totalStock < 10) stats.lowStockItems++;
      } catch (error) {
        console.error(`Error calculating stats for product ${product._id}:`, error);
      }
    }

    res.json({
      items: filteredData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalItems: totalProducts,
        hasNext: page < Math.ceil(totalProducts / limit),
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ message: 'Error fetching inventory data', error: error.message });
  }
};

// Get products with latest purchase pricing for purchase orders
const getProductsWithPricing = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ product_name: 1 });

    // For each product, get the latest purchase details
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        // Get the latest purchase item for this product
        const latestPurchaseItem = await PurchaseItem.findOne()
          .populate({
            path: 'batch_id',
            match: { product_id: product._id },
            select: 'product_id'
          })
          .sort({ createdAt: -1 })
          .exec();

        // Calculate average purchase rate from all purchase items for this product
        const purchaseItems = await PurchaseItem.find()
          .populate({
            path: 'batch_id',
            match: { product_id: product._id }
          })
          .exec();

        const validItems = purchaseItems.filter(item => item.batch_id);
        const avgPurchaseRate = validItems.length > 0 
          ? validItems.reduce((sum, item) => sum + item.purchase_rate, 0) / validItems.length 
          : 0;

        return {
          _id: product._id,
          product_name: product.product_name,
          category: product.category,
          hsn_code: product.hsn_code,
          description: product.description,
          latestPurchaseRate: latestPurchaseItem?.purchase_rate || 0,
          latestTaxRate: latestPurchaseItem?.tax_percent || 0,
          avgPurchaseRate: avgPurchaseRate
        };
      })
    );

    res.json(productsWithPricing);
  } catch (error) {
    console.error('Error fetching products with pricing:', error);
    res.status(500).json({ message: 'Error fetching products with pricing', error: error.message });
  }
};

// Get low stock products for purchase order suggestions - OPTIMIZED
const getLowStockProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const lowStockThreshold = parseInt(req.query.threshold) || 10;

    // Optimized aggregation pipeline to get products with stock calculations in one query
    const lowStockProducts = await Product.aggregate([
      // Stage 1: Match all products
      { $match: {} },
      
      // Stage 2: Lookup batches and calculate total stock
      {
        $lookup: {
          from: 'product_batches',
          localField: '_id',
          foreignField: 'product_id',
          as: 'batches'
        }
      },
      
      // Stage 3: Calculate total stock
      {
        $addFields: {
          currentStock: {
            $sum: {
              $map: {
                input: '$batches',
                as: 'batch',
                in: { $ifNull: ['$$batch.quantity_in_stock', 0] }
              }
            }
          }
        }
      },
      
      // Stage 4: Filter only low stock products
      {
        $match: {
          currentStock: { $lte: lowStockThreshold }
        }
      },
      
      // Stage 5: Lookup latest purchase rate
      {
        $lookup: {
          from: 'purchase_items',
          let: { productId: '$_id' },
          pipeline: [
            {
              $lookup: {
                from: 'product_batches',
                localField: 'batch_id',
                foreignField: '_id',
                as: 'batch_info'
              }
            },
            {
              $match: {
                $expr: {
                  $eq: [{ $arrayElemAt: ['$batch_info.product_id', 0] }, '$$productId']
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'latestPurchase'
        }
      },
      
      // Stage 6: Project final structure
      {
        $project: {
          _id: 1,
          product_name: 1,
          category: 1,
          description: 1,
          hsn_code: 1,
          currentStock: 1,
          lowStockThreshold: { $literal: lowStockThreshold },
          isOutOfStock: { $eq: ['$currentStock', 0] },
          latestPurchaseRate: {
            $ifNull: [
              { $arrayElemAt: ['$latestPurchase.purchase_rate', 0] },
              0
            ]
          },
          latestTaxRate: {
            $ifNull: [
              { $arrayElemAt: ['$latestPurchase.tax_percent', 0] },
              0
            ]
          },
          suggestedQuantity: 7 // Will be updated by external API call or randomized in code
        }
      },
      
      // Stage 7: Sort by current stock (lowest first)
      { $sort: { currentStock: 1, product_name: 1 } },
      
      // Stage 8: Limit results
      { $limit: limit }
    ]);

    // Get suggested quantities for each product from external API
    const productsWithSuggestions = await Promise.all(
      lowStockProducts.map(async (product) => {
        try {
          // Make internal API call to get suggested quantity
          const suggestionResponse = await getSuggestedQuantityInternal(product._id);
          return {
            ...product,
            suggestedQuantity: suggestionResponse.suggestedQuantity,
            confidence: suggestionResponse.confidence,
            reasoning: suggestionResponse.reasoning
          };
        } catch (error) {
          console.log(`Failed to get suggestion for ${product.product_name}, using fallback`);
          // Generate consistent random value based on product name hash
          const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const randomQuantity = 4 + (hash % 12); // Range 4-15
          return {
            ...product,
            suggestedQuantity: randomQuantity,
            confidence: 0.3,
            reasoning: `Fallback quantity (${randomQuantity}) due to API error`
          };
        }
      })
    );

    res.json(productsWithSuggestions);

  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Error fetching low stock products', error: error.message });
  }
};

// Internal helper function for getting suggested quantity
const getSuggestedQuantityInternal = async (productId) => {
  try {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get current stock
    const batches = await ProductBatch.find({ product_id: productId });
    const currentStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
    
    // Get historical sales data for the product (last 3 months for faster processing)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const salesData = await SaleItem.aggregate([
      {
        $lookup: {
          from: 'product_batches',
          localField: 'batch_id',
          foreignField: '_id',
          as: 'batch_info'
        }
      },
      {
        $match: {
          'batch_info.product_id': product._id,
          createdAt: { $gte: threeMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$quantity' },
          avgMonthlySales: { $avg: '$quantity' }
        }
      }
    ]);

    try {
      // Call your custom reorder API with product ID in the URL
      const baseApiUrl = process.env.QUANTITY_SUGGESTION_API || 'https://42aa5c50b0e1.ngrok-free.app/reorder';
      const externalApiUrl = `${baseApiUrl}/${product._id}`;
      
      // API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for ML model
      
      const response = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.EXTERNAL_API_KEY ? `Bearer ${process.env.EXTERNAL_API_KEY}` : undefined
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const responseData = await response.json();
        
        // Extract reorder_point from the API response
        const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let suggestedQuantity = 4 + (hash % 12); // Deterministic fallback between 4-15
        
        if (responseData.reorder_point && typeof responseData.reorder_point === 'number') {
          suggestedQuantity = responseData.reorder_point;
        }
        
        // Ensure reasonable bounds
        suggestedQuantity = Math.max(1, Math.min(1000, Math.round(suggestedQuantity)));
        
        return {
          suggestedQuantity: suggestedQuantity,
          confidence: 0.9, // High confidence since it's from your trained model
          reasoning: `Reorder point calculation: ${responseData.reorder_needed ? 'Reorder needed' : 'Stock sufficient'}`,
          source: 'reorder_api',
          apiData: {
            currentInventory: responseData.current_inventory,
            avgDailyUsage: responseData.avg_daily_usage,
            reorderPoint: responseData.reorder_point,
            safetyStock: responseData.safety_stock,
            reorderNeeded: responseData.reorder_needed,
            daysUntilReorder: responseData.days_until_reorder,
            leadTimeDays: responseData.lead_time_days,
            calculatedOn: responseData.calculated_on
          }
        };
      } else {
        throw new Error(`Reorder API error: ${response.status} - ${response.statusText}`);
      }
      
    } catch (externalError) {
      // Log the error for debugging
      console.error('Reorder API call failed:', {
        productId: product._id,
        url: `${baseApiUrl}/${product._id}`,
        error: externalError.message
      });
      
      // Fallback to deterministic quantity between 4-15 if external API fails
      const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackQuantity = 4 + (hash % 12); // Range 4-15
      return {
        suggestedQuantity: fallbackQuantity,
        confidence: 0.3,
        reasoning: `Fallback quantity (${fallbackQuantity}) due to API error: ${externalError.message}`,
        source: 'fallback'
      };
    }

  } catch (error) {
    console.error('getSuggestedQuantityInternal failed:', {
      productId: product._id,
      error: error.message
    });
    
    const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackQuantity = 4 + (hash % 12); // Range 4-15
    return {
      suggestedQuantity: fallbackQuantity,
      confidence: 0.3,
      reasoning: `Error occurred: ${error.message} (using fallback: ${fallbackQuantity})`,
      source: 'error_fallback'
    };
  }
};

// Get suggested quantity from external API
const getSuggestedQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get current stock
    const batches = await ProductBatch.find({ product_id: productId });
    const currentStock = batches.reduce((sum, batch) => sum + (batch.quantity_in_stock || 0), 0);
    
    // Get historical sales data for the product (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesData = await SaleItem.aggregate([
      {
        $lookup: {
          from: 'product_batches',
          localField: 'batch_id',
          foreignField: '_id',
          as: 'batch_info'
        }
      },
      {
        $match: {
          'batch_info.product_id': product._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$quantity' },
          avgMonthlySales: { $avg: '$quantity' },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    try {
      // Call your custom reorder API with product ID in the URL
      const baseApiUrl = process.env.QUANTITY_SUGGESTION_API || 'https://42aa5c50b0e1.ngrok-free.app/reorder';
      const externalApiUrl = `${baseApiUrl}/${product._id}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.EXTERNAL_API_KEY ? `Bearer ${process.env.EXTERNAL_API_KEY}` : undefined
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const responseData = await response.json();
        
        // Extract reorder_point from the API response
        const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let suggestedQuantity = 4 + (hash % 12); // Deterministic fallback between 4-15
        
        if (responseData.reorder_point && typeof responseData.reorder_point === 'number') {
          suggestedQuantity = responseData.reorder_point;
        }
        
        suggestedQuantity = Math.max(1, Math.min(1000, Math.round(suggestedQuantity)));
        
        res.json({ 
          suggestedQuantity: suggestedQuantity,
          confidence: 0.9,
          reasoning: `Reorder point calculation: ${responseData.reorder_needed ? 'Reorder needed' : 'Stock sufficient'}`,
          source: 'reorder_api',
          apiData: {
            currentInventory: responseData.current_inventory,
            avgDailyUsage: responseData.avg_daily_usage,
            reorderPoint: responseData.reorder_point,
            safetyStock: responseData.safety_stock,
            reorderNeeded: responseData.reorder_needed,
            daysUntilReorder: responseData.days_until_reorder,
            leadTimeDays: responseData.lead_time_days,
            calculatedOn: responseData.calculated_on
          }
        });
      } else {
        throw new Error(`Reorder API error: ${response.status}`);
      }
      
    } catch (externalError) {
      console.error('Reorder API call failed in getSuggestedQuantity:', {
        productId: product._id,
        url: `${baseApiUrl}/${product._id}`,
        error: externalError.message
      });
      
      // Fallback to deterministic quantity between 4-15 if external API fails
      const hash = product.product_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackQuantity = 4 + (hash % 12); // Range 4-15
      res.json({
        suggestedQuantity: fallbackQuantity,
        confidence: 0.3,
        reasoning: `Fallback quantity (${fallbackQuantity}) due to API error: ${externalError.message}`,
        source: 'fallback'
      });
    }

  } catch (error) {
    console.error('Error getting suggested quantity:', error);
    res.status(500).json({ 
      suggestedQuantity: 7,
      confidence: 0.3,
      reasoning: 'Error occurred, using default quantity',
      source: 'error_fallback',
      error: error.message 
    });
  }
};

module.exports = {
  searchProducts,
  createProduct,
  getProducts,
  getProductBatches,
  getProductsWithPricing,
  getInventoryPaginated,
  getCategories,
  getLowStockProducts,
  getSuggestedQuantity
};