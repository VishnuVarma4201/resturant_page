const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");

// Create reservation
router.post("/", authenticateUser, reservationController.createReservation);

// Get user's reservations
router.get("/me", authenticateUser, reservationController.getUserReservations);

// Get all reservations (admin only)
router.get("/", authenticateUser, authorizeRoles('admin'), reservationController.getAllReservations);

// Update reservation status (admin only)
router.put("/:id", authenticateUser, authorizeRoles('admin'), reservationController.updateReservationStatus);

// Delete reservation (admin only)
router.delete("/:id", authenticateUser, authorizeRoles('admin'), reservationController.deleteReservation);

module.exports = router;