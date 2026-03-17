const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Allow// Admins and Teachers can view
router.get('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.getAllCourses);

// Only admins can create/update/delete courses and groups
router.post('/', authenticateToken, authorizeRole('ADMIN'), courseController.createCourse);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), courseController.deleteCourse);
router.post('/groups', authenticateToken, authorizeRole('ADMIN'), courseController.createGroup);
router.put('/groups/:id', authenticateToken, authorizeRole('ADMIN'), courseController.updateGroup);
router.delete('/groups/:id', authenticateToken, authorizeRole('ADMIN'), courseController.deleteGroup);

// Materials
router.get('/materials/all', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.getMaterials);
router.post('/materials/upload', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.uploadMaterial);
router.delete('/materials/:id', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.deleteMaterial);

module.exports = router;
