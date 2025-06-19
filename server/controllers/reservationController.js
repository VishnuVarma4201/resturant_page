const Reservation = require('../models/Reservation');
const { sendSMS } = require('../utils/twilio');
const socketManager = require('../utils/socketManager');

// Get all reservations (admin)
const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation
      .find()
      .populate('user', 'name email phone')
      .populate('assignedBy', 'name')
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      reservations: reservations.map(reservation => ({
        id: reservation._id,
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        tableNumber: reservation.tableNumber,
        specialRequests: reservation.specialRequests,
        assignedBy: reservation.assignedBy?.name,
        assignedAt: reservation.assignedAt
      }))
    });
  } catch (err) {
    console.error('Get all reservations error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reservations" 
    });
  }
};

// Get user's reservations
const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation
      .find({ user: req.user.id })
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      reservations: reservations.map(reservation => ({
        id: reservation._id,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        tableNumber: reservation.tableNumber,
        specialRequests: reservation.specialRequests,
        confirmationCode: reservation.confirmationCode
      }))
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch your reservations" 
    });
  }
};

// Create new reservation
const createReservation = async (req, res) => {
  try {
    const { date, time, partySize, specialRequests } = req.body;
    const { name, email, phone } = req.user;

    // Generate a unique confirmation code
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const reservation = new Reservation({
      user: req.user.id,
      name,
      email,
      phone,
      date,
      time,
      partySize,
      specialRequests,
      confirmationCode
    });

    await reservation.save();

    // Send confirmation SMS
    const message = `Your reservation request has been received! Confirmation code: ${confirmationCode}. We'll notify you once it's confirmed.`;
    await sendSMS(phone, message);

    // Send notification to admin via WebSocket
    socketManager.emitToAdmin('newReservation', {
      id: reservation._id,
      name,
      date,
      time,
      partySize
    });

    res.status(201).json({
      success: true,
      message: "Reservation request submitted successfully",
      reservation: {
        id: reservation._id,
        date,
        time,
        partySize,
        status: reservation.status,
        confirmationCode
      }
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create reservation" 
    });
  }
};

// Accept/Reject reservation (admin)
const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status, tableNumber, rejectionReason } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'accepted' or 'rejected'"
      });
    }

    const reservation = await Reservation.findById(reservationId)
      .populate('user', 'phone email name');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    if (status === 'accepted') {
      if (!tableNumber) {
        return res.status(400).json({
          success: false,
          message: "Table number is required for accepting reservation"
        });
      }

      // Check if table is available
      const isAvailable = await Reservation.isTableAvailable(
        reservation.date,
        reservation.time,
        tableNumber,
        reservationId
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Selected table is not available for this time slot"
        });
      }

      reservation.tableNumber = tableNumber;
    }

    reservation.status = status;
    reservation.assignedBy = req.user.id;
    reservation.assignedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      reservation.rejectionReason = rejectionReason;
    }

    await reservation.save();

    // Send notification to customer
    const message = status === 'accepted'
      ? `Your reservation for ${reservation.time} has been confirmed! Table #${tableNumber} has been assigned. Confirmation code: ${reservation.confirmationCode}`
      : `We apologize, but your reservation for ${reservation.time} could not be accommodated${rejectionReason ? ': ' + rejectionReason : ''}.`;

    await sendSMS(reservation.user.phone, message);

    // Notify user via WebSocket
    socketManager.emitToUser(reservation.user._id, 'reservationUpdated', {
      id: reservation._id,
      status,
      tableNumber: reservation.tableNumber,
      message
    });

    res.json({
      success: true,
      message: `Reservation ${status} successfully`,
      reservation: {
        id: reservation._id,
        status: reservation.status,
        tableNumber: reservation.tableNumber
      }
    });
  } catch (err) {
    console.error('Update reservation status error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update reservation status" 
    });
  }
};

// Cancel reservation (user)
const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const reservation = await Reservation.findOne({
      _id: reservationId,
      user: req.user.id
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    if (!['pending', 'accepted'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel this reservation"
      });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Notify admin via WebSocket
    socketManager.emitToAdmin('reservationCancelled', {
      id: reservation._id,
      tableNumber: reservation.tableNumber
    });

    res.json({
      success: true,
      message: "Reservation cancelled successfully"
    });
  } catch (err) {
    console.error('Cancel reservation error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to cancel reservation" 
    });
  }
};

// Delete reservation (admin)
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('user', 'phone name');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    // Don't allow deletion of completed reservations
    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed reservations"
      });
    }

    // Store reservation details for notification
    const { user, date, time, tableNumber } = reservation;

    // Delete the reservation
    await Reservation.findByIdAndDelete(id);

    // Notify the user via SMS
    if (user && user.phone) {
      const message = `Your reservation for ${time} on ${new Date(date).toLocaleDateString()} ${tableNumber ? `(Table #${tableNumber})` : ''} has been cancelled by the restaurant.`;
      await sendSMS(user.phone, message).catch(console.error);
    }

    // Notify user via WebSocket
    if (user) {
      socketManager.emitToUser(user._id, 'reservationDeleted', {
        id: reservation._id,
        message: 'Your reservation has been cancelled by the restaurant.'
      });
    }

    // Notify admins
    socketManager.emitToAdmin('reservationDeleted', {
      id: reservation._id,
      tableNumber: reservation.tableNumber
    });

    res.json({
      success: true,
      message: "Reservation deleted successfully"
    });

  } catch (err) {
    console.error('Delete reservation error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to delete reservation"
    });
  }
};

module.exports = {
  getAllReservations,
  getUserReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
  cancelReservation
};
