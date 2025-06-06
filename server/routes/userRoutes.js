const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { getDeliveryBoys } = require('../controllers/userController');

// Get delivery boys (admin only)
router.get('/delivery-boys', authenticateUser, authorizeRoles('admin'), getDeliveryBoys);

// ... other routes

module.exports = router;
