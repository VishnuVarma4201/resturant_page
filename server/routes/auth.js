const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendOtp");
const sendSMS = require("../utils/sendSMS");
const User = require("../models/User");

const router = express.Router();

const { authValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Register with validation
router.post("/register", 
    authLimiter,
    authValidation.signup,
    async (req, res) => {
        try {
            const { name, email, password, phone } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

    // Hash password
    const hashed = await bcrypt.hash(password, 12);
    
    // Create user with role
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password: hashed, 
      phone,
      role: 'user' // default role
    });

    // Generate token with user ID
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token with user ID
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Login failed" });
  }
});

// 📧 Send OTP via Email
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  try {
    await sendOTP(email, otp);
    res.json({ success: true, message: "OTP sent", otp }); // remove OTP in prod
  } catch {
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

// 📱 Send OTP via SMS
router.post("/send-sms-otp", async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  try {
    console.log('Attempting to send SMS to:', phone);
    const result = await sendSMS(phone, otp);
    console.log('SMS send result:', result);
    res.json({ success: true, message: "SMS OTP sent", otp });
  } catch (error) {
    console.error('SMS send error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    res.status(500).json({ 
      success: false, 
      message: "Failed to send SMS OTP",
      error: {
        message: error.message,
        code: error.code,
        moreInfo: error.moreInfo
      }
    });
  }
});

module.exports = router;
