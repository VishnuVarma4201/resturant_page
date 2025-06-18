const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    // Clean and validate token
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role === 'delivery') {
        const deliveryBoy = await DeliveryBoy.findById(decoded.id).select("-password");
        if (!deliveryBoy) {
          return res.status(401).json({
            success: false,
            message: "Delivery boy not found",
          });
        }
        req.user = { ...deliveryBoy.toObject(), role: 'delivery' };
      } else {
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found",
          });
        }
        req.user = user;
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
