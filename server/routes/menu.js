// server/routes/menu.js

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

const { cache, clearCache } = require('../middleware/cache');
const { menuItemValidation } = require('../middleware/validation');

// Public routes with caching
router.get('/items', cache(1800), menuController.getMenu); // Cache for 30 minutes
router.get('/categories', cache(3600), menuController.getCategories); // Cache for 1 hour

// Admin routes with validation and cache clearing
router.post('/items', 
    authenticateUser, 
    authorizeRoles('admin'), 
    menuItemValidation,
    clearCache('cache:/api/menu/*'),
    menuController.addMenuItem
);

router.put('/items/:id', 
    authenticateUser, 
    authorizeRoles('admin'), 
    menuItemValidation,
    clearCache('cache:/api/menu/*'),
    menuController.updateMenuItem
);

router.patch('/items/:id/availability', 
    authenticateUser, 
    authorizeRoles('admin'),
    clearCache('cache:/api/menu/*'),
    menuController.toggleAvailability
);

router.delete('/items/:id', 
    authenticateUser, 
    authorizeRoles('admin'),
    clearCache('cache:/api/menu/*'),
    menuController.deleteMenuItem
);

module.exports = router;