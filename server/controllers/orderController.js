// server/controllers/orderController.js

const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const DeliveryBoy = require('../models/DeliveryBoy');
const { generateOTP } = require('../utils/sendOtp');
const sendSMS = require('../utils/sendSMS');
const socketManager = require('../utils/socketManager');

const orderController = {
  placeOrder: async (req, res) => {
    try {
      const { items, deliveryAddress, deliveryNotes } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
      }

      if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || 
          !deliveryAddress.state || !deliveryAddress.zipCode) {
        return res.status(400).json({ 
          message: 'Complete delivery address is required',
          required: ['street', 'city', 'state', 'zipCode']
        });
      }

      // Validate items and calculate price breakdown
      let subTotal = 0;
      const validatedItems = [];
      const TAX_RATE = 0.18; // 18% GST
      const DELIVERY_CHARGE = 50; // Fixed delivery charge

      for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) {
          return res.status(400).json({ message: `Menu item not found: ${item.menuItem}` });
        }

        const itemTotal = menuItem.price * item.quantity;
        subTotal += itemTotal;

        validatedItems.push({
          menuItem: menuItem._id,
          quantity: item.quantity
        });
      }

      // Calculate tax and total
      const tax = subTotal * TAX_RATE;
      const totalAmount = subTotal + tax + DELIVERY_CHARGE;

      // Get user's phone number for delivery
      const user = await User.findById(req.user._id);
      if (!user || !user.phone) {
        return res.status(400).json({ message: 'User phone number is required for delivery' });
      }

      // Generate OTP for delivery confirmation
      const otp = generateOTP();

      // Send OTP via SMS
      try {
        await sendSMS(user.phone, otp);
      } catch (err) {
        console.error('Failed to send OTP:', err);
        // Continue with order creation even if SMS fails
        console.log('Proceeding with order creation despite SMS failure. OTP:', otp);
        // In production, you might want to implement a retry mechanism or alternative notification method
      }

      // Create payment ID
      const paymentId = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);

      // Calculate estimated delivery time (45-60 minutes from now)
      const now = new Date();
      const estimatedStart = new Date(now.getTime() + 45 * 60000); // 45 minutes
      const estimatedEnd = new Date(now.getTime() + 60 * 60000);   // 60 minutes

      // Create new order
      const order = new Order({
        deliveryPhone: user.phone,
        user: req.user._id,
        items: validatedItems,
        subTotal,
        deliveryCharge: DELIVERY_CHARGE,
        tax,
        totalAmount,
        paymentId,
        otp,
        status: 'placed',
        paymentMethod: req.body.paymentMethod || 'cash',
        deliveryAddress,
        deliveryNotes,
        estimatedDeliveryTime: {
          start: estimatedStart,
          end: estimatedEnd
        }
      });

      await order.save();

      // Add order reference to user's orders
      await User.findByIdAndUpdate(req.user._id, { 
        $push: { orders: order._id }
      });

      // Notify admins with delivery details
      socketManager.notifyAdmins('new_order', { 
        orderId: order._id,
        user: {
          name: user.name,
          phone: user.phone
        },
        deliveryAddress,
        estimatedDelivery: order.estimatedDeliveryTime,
        totalAmount: totalAmount
      });

      res.status(201).json(order);
    } catch (err) {
      console.error('Error placing order:', err);
      res.status(500).json({ message: 'Order placing failed' });
    }
  },

  getUserOrders: async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user._id })
        .populate('items.menuItem')
        .sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      console.error('Error fetching user orders:', err);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  },

  getAllOrders: async (req, res) => {
    try {
      const orders = await Order.find()
        .populate('user', 'name email')
        .populate('items.menuItem')
        .sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      console.error('Error fetching all orders:', err);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  },

  acceptOrder: async (req, res) => {
    const { orderId } = req.params;
    try {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      order.status = 'accepted';
      await order.save();

      res.json({ message: 'Order accepted', order });
    } catch (err) {
      console.error('Error accepting order:', err);
      res.status(500).json({ message: 'Failed to accept order' });
    }
  },

  assignDelivery: async (req, res) => {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    if (!deliveryBoyId) {
      return res.status(400).json({ 
        message: 'Delivery person ID is required',
        example: { deliveryBoyId: "delivery_person_id_here" }
      });
    }

    try {
      // Find and validate order
      const order = await Order.findById(orderId)
        .populate('user', 'name email phone')
        .populate('items.menuItem');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status !== 'accepted') {
        return res.status(400).json({ 
          message: 'Order must be accepted before assigning delivery',
          currentStatus: order.status
        });
      }

      // Find and validate delivery person
      const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);

      if (!deliveryBoy) {
        return res.status(404).json({ message: 'Delivery person not found' });
      }

      if (deliveryBoy.status !== 'available') {
        return res.status(400).json({ message: 'Delivery person is not available' });
      }

      // Update order and delivery boy status
      order.status = 'assigned';
      order.assignedTo = deliveryBoyId;
      await order.save();

      deliveryBoy.status = 'busy';
      await deliveryBoy.save();

      // Notify delivery boy about new assignment
      socketManager.notifyDeliveryBoy(deliveryBoyId, 'new_order_assigned', {
        orderId: order._id,
        customerName: order.user.name,
        customerPhone: order.user.phone,
        deliveryAddress: order.deliveryAddress,
        items: order.items
      });

      // Notify user about delivery assignment
      socketManager.notifyUser(order.user._id, 'delivery_assigned', {
        orderId: order._id,
        deliveryBoy: {
          name: deliveryBoy.name,
          phone: deliveryBoy.phone
        }
      });

      // Send SMS notification to user
      try {
        await sendSMS(
          order.deliveryPhone,
          `Your order #${order._id} has been assigned to ${deliveryBoy.name}. You can contact them at ${deliveryBoy.phone}.`
        );
      } catch (err) {
        console.error('Failed to send delivery notification:', err);
        // Don't fail the assignment if SMS fails
      }

      res.json({ 
        message: 'Delivery assigned successfully',
        order
      });
    } catch (err) {
      console.error('Error assigning delivery:', err);
      res.status(500).json({ message: 'Failed to assign delivery' });
    }
  },

  deliveryUpdateStatus: async (req, res) => {
    const { orderId } = req.params;
    const { status, otp, location } = req.body;

    try {
      // Verify the request is from a delivery person
      if (req.user.role !== 'delivery') {
        return res.status(403).json({ 
          message: 'Only delivery personnel can update delivery status',
          yourRole: req.user.role
        });
      }

      const order = await Order.findById(orderId)
        .populate('assignedTo', 'name email')
        .populate('user', 'name email');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Verify assignment
      if (!order.assignedTo) {
        return res.status(400).json({ message: 'Order not assigned to any delivery person' });
      }

      if (order.assignedTo._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to update this order',
          assigned: order.assignedTo._id,
          requesting: req.user._id
        });
      }

      // Handle status transitions
      if (status === 'delivering') {
        if (order.status !== 'assigned') {
          return res.status(400).json({ message: 'Order must be assigned before starting delivery' });
        }
        order.status = 'delivering';

        // Notify user about delivery start
        socketManager.notifyUser(order.user._id, 'delivery_started', {
          orderId: order._id,
          deliveryBoy: {
            name: req.user.name,
            phone: req.user.phone
          },
          location: location
        });
      }
      else if (status === 'delivered') {
        // Verify payment status
        if (order.paymentStatus !== 'completed') {
          // For cash payments, mark as completed upon delivery
          if (order.paymentMethod === 'cash') {
            order.paymentStatus = 'completed';
          } else {
            return res.status(400).json({ 
              message: 'Online payment must be completed before marking as delivered',
              paymentId: order.paymentId
            });
          }
        }

        // Verify OTP - check both otp and opt fields for better UX
        const providedOTP = otp || req.body.opt; // Handle both spellings
        if (!providedOTP || providedOTP !== order.otp) {
          return res.status(400).json({ 
            message: 'Invalid OTP for delivery confirmation',
            hint: 'Ask customer for the OTP sent to their phone',
            expected: order.otp, // Only show in development
            provided: providedOTP
          });
        }

        order.status = 'delivered';
        order.deliveredAt = new Date();

        // Notify user about delivery completion
        socketManager.notifyUser(order.user._id, 'order_delivered', {
          orderId: order._id,
          deliveryTime: order.deliveredAt
        });

        // Notify admins about delivery completion
        socketManager.notifyAdmins('delivery_completed', {
          orderId: order._id,
          deliveryBoy: {
            id: req.user._id,
            name: req.user.name
          },
          deliveryTime: order.deliveredAt
        });

        // Update delivery boy's earnings and stats
        const deliveryBoy = await DeliveryBoy.findById(order.assignedTo);
        if (deliveryBoy) {
          // Add delivery record
          deliveryBoy.deliveries.push({
            order: order._id,
            earnings: order.deliveryCharge,
            deliveredAt: new Date()
          });

          // Update statistics
          await deliveryBoy.updateStats();
          await deliveryBoy.save();
        }
      }
      else {
        return res.status(400).json({ 
          message: 'Invalid status value',
          validValues: ['delivering', 'delivered'],
          currentStatus: order.status
        });
      }

      await order.save();

      // Notify all parties about status update
      socketManager.handleOrderStatusUpdate({
        orderId: order._id,
        status: order.status,
        updatedBy: {
          userId: order.user._id,
          role: req.user.role,
          deliveryBoyId: req.user._id
        },
        location: location
      });

      res.json({ 
        message: 'Order status updated successfully',
        order
      });
    } catch (err) {
      console.error('Error updating delivery status:', err);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  },

  getOrderSummary: async (req, res) => {
    const { orderId } = req.params;
    try {
      const order = await Order.findById(orderId)
        .populate('items.menuItem')
        .populate('assignedTo', 'name phone')
        .populate('user', 'name phone');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check authorization
      if (req.user.role === 'delivery' && order.assignedTo?._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      if (req.user.role === 'user' && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }

      // Format summary based on role
      const summary = {
        orderId: order._id,
        status: order.status,
        items: order.items.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price
        })),
        pricing: {
          subTotal: order.subTotal,
          deliveryCharge: order.deliveryCharge,
          tax: order.tax,
          totalAmount: order.totalAmount
        },
        paymentDetails: {
          method: order.paymentMethod,
          status: order.paymentStatus,
          paymentId: order.paymentId
        }
      };

      // Add role-specific details
      if (req.user.role === 'delivery') {
        summary.customer = {
          name: order.user.name,
          phone: order.user.phone
        };
      } else if (req.user.role === 'user') {
        summary.delivery = order.assignedTo ? {
          name: order.assignedTo.name,
          phone: order.assignedTo.phone
        } : null;
      }

      res.json(summary);
    } catch (err) {
      console.error('Error getting order summary:', err);
      res.status(500).json({ message: 'Failed to get order summary' });
    }
  },

  addDeliveryFeedback: async (req, res) => {
    const { orderId } = req.params;
    const { rating, tip, comment } = req.body;

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to add feedback to this order' });
      }

      if (order.status !== 'delivered') {
        return res.status(400).json({ message: 'Can only add feedback to delivered orders' });
      }

      // Update order feedback
      order.userFeedback = { rating, tip, comment };
      await order.save();

      // Update delivery boy stats
      const deliveryBoy = await DeliveryBoy.findById(order.assignedTo);
      if (deliveryBoy) {
        // Find or create delivery record
        let delivery = deliveryBoy.deliveries.find(d => 
          d.order && d.order.toString() === order._id.toString()
        );

        if (!delivery) {
          delivery = {
            order: order._id,
            earnings: order.deliveryCharge,
            deliveredAt: order.deliveredAt
          };
          deliveryBoy.deliveries.push(delivery);
        }

        // Update delivery record
        delivery.rating = rating;
        delivery.tip = tip || 0;
        delivery.comment = comment;
        
        // Base earnings (delivery charge) plus tip
        delivery.earnings = order.deliveryCharge + (tip || 0);

        // Mark the deliveries array as modified
        deliveryBoy.markModified('deliveries');
        
        // Update overall statistics
        await deliveryBoy.updateStats();
        await deliveryBoy.save();
      }

      res.json({
        message: 'Delivery feedback added successfully',
        order
      });
    } catch (err) {
      console.error('Error adding delivery feedback:', err);
      res.status(500).json({ message: 'Failed to add delivery feedback' });
    }
  },

  getAvailableDeliveryBoys: async (req, res) => {
    try {
      // Find all users with role 'delivery'
      const availableDeliveryBoys = await User.find({
        role: 'delivery'
      }).select('_id name email phone');

      // If no delivery boys found
      if (!availableDeliveryBoys.length) {
        return res.status(404).json({ message: 'No delivery persons available' });
      }

      res.json({
        count: availableDeliveryBoys.length,
        deliveryBoys: availableDeliveryBoys.map(boy => ({
          id: boy._id,
          name: boy.name,
          email: boy.email,
          phone: boy.phone
        }))
      });
    } catch (err) {
      console.error('Error fetching available delivery boys:', err);
      res.status(500).json({ message: 'Failed to fetch available delivery boys' });
    }
  }
};

module.exports = orderController;
