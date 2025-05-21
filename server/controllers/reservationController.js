const reservationModel = require("../models/Reservation");
// ✅ GET all reservations (admin)
const getAllReservations = async (req, res) => {
  try {
    const reservations = await reservationModel.find().populate("user", "name email");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
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
  const { date, timeSlot } = req.body;
  try {
    const reservation = new Reservation({
      user: req.user.id,
      date,
      timeSlot,
    });
    await reservation.save();
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: "Failed to create reservation" });
  }
};

// ✅ PUT update status & assign table (admin)
const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, tableNumber } = req.body;

  try {
    const updated = await Reservation.findByIdAndUpdate(
      id,
      { status, tableNumber },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Reservation not found" });
    res.json(updated);
  } catch (err) {
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
