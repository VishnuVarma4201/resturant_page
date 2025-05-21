// server/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPhone: { type: String, required: true }, // Phone number for delivery notifications
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, default: 1 },
  }],
  subTotal: { type: Number, required: true }, // Items total
  deliveryCharge: { type: Number, required: true, default: 50 },
  tax: { type: Number, required: true }, // GST or applicable tax
  totalAmount: { type: Number, required: true }, // Final amount including all charges
  status: {
    type: String,
    enum: ['placed', 'accepted', 'assigned', 'delivering', 'delivered', 'cancelled'],
    default: 'placed',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryBoy' }, // Changed to DeliveryBoy model
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  paymentId: { type: String }, // Generated payment ID
  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    required: true,
    default: 'cash'
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    landmark: String
  },
  estimatedDeliveryTime: {
    start: { type: Date },
    end: { type: Date }  
  },
  actualDeliveryTime: { type: Date },
  deliveryNotes: String,
  otp: { type: String, required: true },
  userFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    tip: { type: Number },
    comment: String
  },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);
