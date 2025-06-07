const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOTP } = require("../utils/sendOtp");
const sendSMS = require("../utils/sendSMS");
const User = require("../models/User");
const { authenticateUser } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

const { authValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Register with validation
router.post("/register", 
    authLimiter,
    authValidation.signup,    async (req, res) => {
        try {
            const { name, email, password, phone } = req.body;
            
            // Validate required fields
            if (!name || !email || !password || !phone) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email address"
                });
            }

            // Validate password strength
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long"
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }// Create user with role - password will be hashed by the model's pre-save hook
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password, 
      phone,
      role: 'user' // default role
    });

    // Generate token with user ID
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );    res.status(201).json({
      success: true,
      message: "Registration successful",
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
    const user = await User.findOne({ email }).select('+password');

    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate clean token
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: token.trim(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
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

// Validate token endpoint
router.get("/validate", authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Google OAuth login
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user if doesn't exist
      const password = await bcrypt.hash(Math.random().toString(36), 12); // random password for Google users
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        profilePicture: picture,
        role: 'user'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

// Twitter OAuth login - Step 1: Get request token
router.get("/twitter", async (req, res) => {
    try {
        const oauth = new OAuth({
            consumer: {
                key: process.env.TWITTER_API_KEY,
                secret: process.env.TWITTER_API_SECRET
            },
            signature_method: 'HMAC-SHA1',
            hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
        });

        const requestData = await oauth.getOAuthRequestToken();
        res.json({
            redirectUrl: `https://api.twitter.com/oauth/authorize?oauth_token=${requestData.oauth_token}`
        });
    } catch (error) {
        console.error('Twitter auth error:', error);
        res.status(500).json({ message: "Error initiating Twitter login" });
    }
});

// Twitter OAuth login - Step 2: Handle callback
router.post("/twitter/callback", async (req, res) => {
    try {
        const { oauth_token, oauth_verifier } = req.body;
        
        const oauth = new OAuth({
            consumer: {
                key: process.env.TWITTER_API_KEY,
                secret: process.env.TWITTER_API_SECRET
            },
            signature_method: 'HMAC-SHA1',
            hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
        });

        const { oauth_access_token } = await oauth.getOAuthAccessToken(oauth_token, oauth_verifier);
        const twitterUserData = await oauth.get('https://api.twitter.com/2/users/me', oauth_access_token);

        // Check if user exists
        let user = await User.findOne({ twitterId: twitterUserData.data.id });

        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                name: twitterUserData.data.name,
                twitterId: twitterUserData.data.id,
                password: await bcrypt.hash(Math.random().toString(36), 12),
                role: 'user'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Twitter callback error:', error);
        res.status(401).json({ message: "Twitter authentication failed" });
    }
});

module.exports = router;
