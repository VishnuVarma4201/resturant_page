// server/models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  partySize: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  tableNumber: { type: Number },
  specialRequests: { type: String },
  notificationSent: { type: Boolean, default: false },
  confirmationCode: { type: String },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  assignedAt: { type: Date },
  rejectionReason: { type: String }
}, {
  timestamps: true
});

// Create indexes for better query performance
ReservationSchema.index({ user: 1, date: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ date: 1, time: 1, tableNumber: 1 });

// Method to check table availability
ReservationSchema.statics.isTableAvailable = async function(date, time, tableNumber, excludeReservationId = null) {
  const query = {
    date: new Date(date),
    time: time,
    tableNumber: tableNumber,
    status: 'accepted'
  };
  
  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const existingReservation = await this.findOne(query);
  return !existingReservation;
};

module.exports = mongoose.model('Reservation', ReservationSchema);
