const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.getAllTasks);
router.post('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.createTask);
router.post('/:taskId/grade', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.gradeWithAI);
router.get('/:taskId/submissions', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), homeworkController.getTaskSubmissions);

// O'quvchi uchun
router.get('/mine', authenticateToken, authorizeRole('STUDENT'), homeworkController.getMyTasks);
router.get('/:taskId/take', authenticateToken, authorizeRole('STUDENT'), homeworkController.getTaskForStudent);
router.post('/:taskId/submit', authenticateToken, authorizeRole('STUDENT'), homeworkController.submitAnswers);

module.exports = router;
