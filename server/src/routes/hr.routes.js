const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hr.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Allow Admin only for HR data
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/teachers', hrController.getAllTeachers);
router.post('/teachers', hrController.createTeacher);
router.put('/teachers/:id', hrController.updateTeacher);
router.delete('/teachers/:id', hrController.deleteTeacher);
router.post('/pay', hrController.payTeacher);
router.post('/kpi', hrController.calculateTeacherKPI);

module.exports = router;
