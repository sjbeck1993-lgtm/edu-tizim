const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
