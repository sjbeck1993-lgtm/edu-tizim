const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Faqat Adminlar o'quvchi boshqara oladi
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/', studentController.getAllStudents);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.put('/:id/transfer', studentController.transferStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
