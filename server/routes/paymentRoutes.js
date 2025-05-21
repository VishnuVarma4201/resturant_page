const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Create payment
router.post('/', authenticateUser, paymentController.createPayment);

// Get user's payments
router.get('/my', authenticateUser, paymentController.getUserPayments);

// Get all payments (admin only)
router.get('/all', authenticateUser, authorizeRoles('admin'), paymentController.getAllPayments);

module.exports = router;