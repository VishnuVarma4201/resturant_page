const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");

const authenticateUser = async (req, res, next) => {
  try {
    // Check for Bearer token in Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token from Bearer format
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token and extract user ID and role
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Check if it's a delivery boy token
    if (decoded.role === 'delivery') {
      const deliveryBoy = await DeliveryBoy.findById(decoded.id).select('-password');
      if (!deliveryBoy) {
        return res.status(404).json({ message: "Delivery boy not found" });
      }
      req.user = { ...deliveryBoy.toObject(), role: 'delivery' };
      next();
      return;
    }

    // Find regular user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ message: "Authentication failed" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for this role" });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};
