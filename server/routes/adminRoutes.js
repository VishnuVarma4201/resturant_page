const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { 
  getProfile, 
  updateProfile, 
  getDashboard,
  updateOrderStatus,
  assignDeliveryBoy
} = require('../controllers/adminController');

// Protect all admin routes
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Dashboard and order management routes
router.get('/dashboard', getDashboard);
router.put('/orders/:orderId', updateOrderStatus);
router.put('/orders/:orderId/assign', assignDeliveryBoy); // Admin route for assigning delivery boy

// Dashboard route (will be removed)
router.get('/dashboard-old', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as admin'
      });
    }

    // Your dashboard data
    const dashboardData = {
      success: true,
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
      },
      orders: []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

module.exports = router;
