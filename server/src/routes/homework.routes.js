const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.getAllTasks);
router.post('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.createTask);
router.post('/:taskId/grade', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.gradeSubmissions);
router.get('/:taskId/submissions', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.getTaskSubmissions);

module.exports = router;
