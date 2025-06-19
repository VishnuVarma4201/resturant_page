const express = require("express");
const router = express.Router();
const {
  getAllReservations,
  getUserReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
  cancelReservation
} = require("../controllers/reservationController");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");

// Public routes
router.post("/", authenticateUser, createReservation);
router.get("/me", authenticateUser, getUserReservations);

// User actions
router.post("/:id/cancel", authenticateUser, cancelReservation);

// Admin only routes
router.get("/admin", authenticateUser, authorizeRoles('admin'), getAllReservations);
router.get("/", authenticateUser, getAllReservations); // For backward compatibility
router.put("/:id", authenticateUser, authorizeRoles('admin'), updateReservationStatus);
router.delete("/:id", authenticateUser, authorizeRoles('admin'), deleteReservation);

module.exports = router;