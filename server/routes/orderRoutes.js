// server/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const DeliveryBoy = require('../models/DeliveryBoy');
const bcrypt = require('bcryptjs');

const { orderValidation, feedbackValidation } = require('../middleware/validation');
const { cache } = require('../middleware/cache');

// User: Place order with validation
router.post('/place', 
    authenticateUser, 
    orderValidation,
    orderController.placeOrder
);

// User: Get own orders with caching
router.get('/myorders', 
    authenticateUser,
    cache(300), // Cache for 5 minutes
    orderController.getUserOrders
);

// User: Add delivery feedback with validation
router.post('/:orderId/feedback', 
    authenticateUser,
    feedbackValidation,
    orderController.addDeliveryFeedback
);

// Get order summary (accessible by relevant user/delivery person)
router.get('/summary/:orderId', authenticateUser, orderController.getOrderSummary);

// Admin: Get all orders
router.get('/', authenticateUser, authorizeRoles('admin'), orderController.getAllOrders);

// Admin: Accept order
router.put('/accept/:orderId', authenticateUser, authorizeRoles('admin'), orderController.acceptOrder);

// Admin: Assign delivery
router.put('/assign/:orderId', authenticateUser, authorizeRoles('admin'), orderController.assignDelivery);

// Delivery: Update delivery status
router.put('/status/:orderId', authenticateUser, authorizeRoles('delivery'), orderController.deliveryUpdateStatus);

// Get available delivery persons (admin only)
router.get('/available-delivery', authenticateUser, authorizeRoles('admin'), orderController.getAvailableDeliveryBoys);

// Reset delivery boy password (admin only)
router.post('/delivery-boy/:id/reset-password', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }
    
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    deliveryBoy.password = hashedPassword;
    await deliveryBoy.save();
    
    res.json({ 
      message: 'Password reset successful',
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;