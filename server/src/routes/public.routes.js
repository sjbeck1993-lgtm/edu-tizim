const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Autentifikatsiya talab qilinmaydi - bular marketing sayti uchun ochiq endpointlar.
router.get('/courses', publicController.getPublicCourses);
router.post('/leads', publicController.submitPublicLead);

module.exports = router;
