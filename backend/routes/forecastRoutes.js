const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get forecast API URL from environment variables
const FORECAST_API_URL = process.env.FORECAST_API_URL || 'https://978f99f96b73.ngrok-free.app';

// Get general forecast (no specific product)
router.get('/forecast', async (req, res) => {
  try {
    console.log('Fetching general forecast from external API...');
    
    const response = await axios.get(`${FORECAST_API_URL}/forecast`, {
      headers: {
        'Content-Type': 'application/json',
        // Add ngrok-skip-browser-warning header if needed
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log('Forecast API response:', response.data);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forecast data',
      error: error.message
    });
  }
});

// Get forecast for specific product/entity by ID
router.get('/forecast/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching forecast for ID: ${id}`);
    
    const response = await axios.get(`${FORECAST_API_URL}/forecast/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    console.log('Forecast API response:', response.data);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching forecast for ID:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to fetch forecast data for ID: ${req.params.id}`,
      error: error.message
    });
  }
});

module.exports = router;