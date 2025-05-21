// server/controllers/deliveryBoyController.js

const DeliveryBoy = require('../models/DeliveryBoy.js');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const socketManager = require('../utils/socketManager');

// Helper function to generate JWT token
const generateToken = (deliveryBoy) => {
  return jwt.sign(
    { id: deliveryBoy._id, role: 'delivery' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
// const User = require('../models/User'); // Add this line

const createDeliveryBoy = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        message: 'All fields are required',
        required: ['name', 'email', 'password', 'phone']
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if delivery boy already exists
    const existingDeliveryBoy = await DeliveryBoy.findOne({ email: email.toLowerCase() });
    if (existingDeliveryBoy) {
      return res.status(400).json({ message: 'Delivery boy already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new delivery boy
    const deliveryBoy = new DeliveryBoy({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone
    });

    await deliveryBoy.save();

    // Generate token
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        status: deliveryBoy.status
      }
    });
  } catch (err) {
    console.error('Error creating delivery boy:', err);
    res.status(500).json({ message: 'Failed to create delivery boy' });
  }
};

const loginDeliveryBoy = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find delivery boy
    const deliveryBoy = await DeliveryBoy.findOne({ email: email.toLowerCase() });
    if (!deliveryBoy) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!deliveryBoy.password || !password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Extended token expiry for testing
    );

    res.json({
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        status: deliveryBoy.status,
        phone: deliveryBoy.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

const getAllDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(deliveryBoys);
  } catch (error) {
    console.error('Error getting delivery boys:', error);
    res.status(500).json({ message: 'Error fetching delivery boys' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    res.json(deliveryBoy);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
};

const getAvailableDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find({
      status: 'active',
      isAvailable: true
    }).select('-password');
    
    res.json(deliveryBoys);
  } catch (error) {
    console.error('Error getting available delivery boys:', error);
    res.status(500).json({ message: 'Error fetching available delivery boys' });
  }
};

const getDeliveryBoyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryBoy = await DeliveryBoy.findById(id).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Check if user is authorized to view details
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ message: 'Not authorized to view these details' });
    }

    res.json(deliveryBoy);
  } catch (error) {
    console.error('Error getting delivery boy details:', error);
    res.status(500).json({ message: 'Error fetching delivery boy details' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude } = req.body;

    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Location coordinates are required',
        required: ['latitude', 'longitude']
      });
    }

    // Find active order
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('assignedTo', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify delivery boy assignment
    if (order.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order\'s location' });
    }

    // Broadcast location update
    socketManager.handleDeliveryLocationUpdate({
      orderId: order._id,
      location: { latitude, longitude },
      deliveryBoyId: req.user._id,
      userId: order.user._id
    });

    res.json({ 
      message: 'Location updated successfully',
      location: { latitude, longitude }
    });
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

// Add missing functions
const getDeliveryStats = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await DeliveryBoy.findById(deliveryBoyId).select('-password');
    const todayDeliveries = await Order.countDocuments({
      'delivery.deliveryBoy': deliveryBoyId,
      'delivery.deliveredAt': { $gte: today },
      status: 'delivered'
    });

    res.json({
      todayDeliveries,
      totalTips: stats.earnings?.tips || 0,
      monthlyEarnings: stats.earnings?.monthly || 0,
      rating: stats.rating || 0,
      totalDeliveries: stats.deliveries?.length || 0
    });
  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({ message: 'Error fetching delivery statistics' });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const deliveryBoyId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      'delivery.deliveryBoy': deliveryBoyId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.delivery.status = status;
    if (status === 'delivered') {
      order.delivery.deliveredAt = new Date();
      order.status = 'delivered';
    }

    await order.save();
    res.json({ message: 'Delivery status updated successfully' });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ message: 'Error updating delivery status' });
  }
};

const getActiveDeliveries = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const activeDeliveries = await Order.find({
      'delivery.deliveryBoy': deliveryBoyId,
      status: { $in: ['accepted', 'out_for_delivery'] }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name phone address');

    res.json(activeDeliveries);
  } catch (error) {
    console.error('Error getting active deliveries:', error);
    res.status(500).json({ message: 'Error fetching active deliveries' });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const { isAvailable } = req.body;

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      deliveryBoyId,
      { isAvailable },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      isAvailable: deliveryBoy.isAvailable
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({ message: 'Error updating availability' });
  }
};

// Export controller functions
module.exports = {
  createDeliveryBoy,
  loginDeliveryBoy,
  getAllDeliveryBoys,
  updateStatus,
  getAvailableDeliveryBoys,
  getDeliveryBoyDetails,
  updateLocation,
  getDeliveryStats,
  updateDeliveryStatus,
  getActiveDeliveries,
  toggleAvailability
};
