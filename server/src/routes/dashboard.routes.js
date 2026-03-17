const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, authorizeRole('ADMIN'), dashboardController.getStats);

module.exports = router;
