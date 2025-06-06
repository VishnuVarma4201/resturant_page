const reservationModel = require("../models/Reservation");
// ✅ GET all reservations (admin)
const getAllReservations = async (req, res) => {
  try {
    const reservations = await reservationModel
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reservations: reservations.map(reservation => ({
        id: reservation._id,
        name: reservation.name || reservation.user?.name,
        email: reservation.email || reservation.user?.email,
        phone: reservation.phone,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        tableNumber: reservation.tableNumber,
        specialRequests: reservation.specialRequests
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

// ✅ GET user’s reservations
const getUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your reservations" });
  }
};

// ✅ POST create new reservation (user)
const createReservation = async (req, res) => {
  const { date, time, partySize, specialRequests, name, email, phone } = req.body;
  try {
    const reservation = new reservationModel({
      user: req.user.id,
      date,
      time,
      partySize,
      specialRequests,
      name,
      email,
      phone,
      status: 'pending'
    });
    
    await reservation.save();
    res.status(201).json({
      success: true,
      reservation: await reservation.populate('user', 'name email')
    });
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create reservation" 
    });
  }
};

// ✅ PUT update status & assign table (admin)
const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, tableNumber } = req.body;

  try {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation status"
      });
    }

    const updated = await reservationModel.findByIdAndUpdate(
      id,
      { 
        status, 
        ...(tableNumber && { tableNumber }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'name email');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found"
      });
    }

    res.json({
      success: true,
      reservation: updated
    });
  } catch (err) {
    console.error('Update reservation status error:', err);
    res.status(500).json({ message: "Failed to update reservation" });
  }
};

// ✅ DELETE reservation (user or admin)
const deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Reservation.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Reservation not found" });
    res.json({ message: "Reservation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete reservation" });
  }
};

module.exports = {
  getAllReservations,
  getUserReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
};
