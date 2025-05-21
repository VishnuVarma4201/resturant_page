const { validationResult, body, param } = require('express-validator');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Order validation rules
const orderValidation = [
    body('items').isArray().notEmpty().withMessage('Items array is required'),
    body('items.*.menuItem').isMongoId().withMessage('Valid menu item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('deliveryAddress').isObject().notEmpty().withMessage('Delivery address is required'),
    body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
    body('deliveryAddress.city').notEmpty().withMessage('City is required'),
    body('deliveryAddress.state').notEmpty().withMessage('State is required'),
    body('deliveryAddress.zipCode').notEmpty().withMessage('ZIP code is required'),
    validateRequest
];

// Authentication validation rules
const authValidation = {
    signup: [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('phone').notEmpty().withMessage('Phone number is required'),
        validateRequest
    ],
    login: [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validateRequest
    ]
};

// Menu item validation rules
const menuItemValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    validateRequest
];

// Reservation validation rules
const reservationValidation = [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    validateRequest
];

// Payment validation rules
const paymentValidation = [
    body('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('method').isIn(['card', 'upi', 'cash']).withMessage('Valid payment method is required'),
    validateRequest
];

// Delivery status validation rules
const deliveryStatusValidation = [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('status').isIn(['delivering', 'delivered']).withMessage('Valid status is required'),
    body('location')
        .optional()
        .isObject()
        .custom((value) => {
            if (value.latitude === undefined || value.longitude === undefined) {
                throw new Error('Location must include latitude and longitude');
            }
            return true;
        }),
    validateRequest
];

// Feedback validation rules
const feedbackValidation = [
    param('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('tip').optional().isFloat({ min: 0 }).withMessage('Tip must be a positive number'),
    body('comment').optional().trim(),
    validateRequest
];

module.exports = {
    orderValidation,
    authValidation,
    menuItemValidation,
    reservationValidation,
    paymentValidation,
    deliveryStatusValidation,
    feedbackValidation
};
