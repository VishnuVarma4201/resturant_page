const User = require('../models/User');
const Order = require('../models/Order');
const DeliveryBoy = require('../models/DeliveryBoy');

exports.getProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('-password');
    res.json(admin);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// Assign delivery boy to order
exports.assignDeliveryBoy = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    // Check if delivery boy is active and available
    if (deliveryBoy.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Delivery boy is not active' });
    }
    if (!deliveryBoy.isAvailable) {
      return res.status(400).json({ success: false, message: 'Delivery boy is not available' });
    }

    // Update order with the assigned delivery boy
    order.assignedTo = deliveryBoyId;
    order.status = 'assigned';
    await order.save();

    // Update delivery boy availability
    deliveryBoy.isAvailable = false;
    await deliveryBoy.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Assign delivery boy error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign delivery boy' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const admin = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone },
      { new: true }
    ).select('-password');
    res.json(admin);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const stats = {
      totalOrders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: 'pending' }),
      totalRevenue: (await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]))[0]?.total || 0
    };

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    res.json({ stats, orders });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
