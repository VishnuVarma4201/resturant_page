// server/models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g., "7:00 PM - 9:00 PM"
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  tableNumber: { type: Number }, // assigned by admin after acceptance
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Reservation', ReservationSchema);
