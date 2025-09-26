const express = require('express');
const { register, login, verifyToken } = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Protected route to verify token
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;