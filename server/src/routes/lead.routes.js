const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply auth middleware. Only Admins should manage leads.
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/', leadController.getAllLeads);
router.post('/', leadController.createLead);
router.patch('/:id/status', leadController.updateLeadStatus);
router.delete('/:id', leadController.deleteLead);

module.exports = router;
