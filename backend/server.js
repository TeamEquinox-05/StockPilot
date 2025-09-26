require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockpilot')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));