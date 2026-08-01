// =============================================================================
// VLRK - Reservation Routes
// =============================================================================

const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
} = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');
const { createReservationRules, validate } = require('../middleware/validate');

// Siswa & Pendamping routes
router.post('/', authenticate, authorize('SISWA', 'PENDAMPING'), createReservationRules, validate, createReservation);
router.get('/my', authenticate, authorize('SISWA', 'PENDAMPING'), getMyReservations);
router.patch('/:id/cancel', authenticate, authorize('SISWA', 'PENDAMPING'), cancelReservation);

// Admin route — list all reservations
router.get('/', authenticate, authorize('ADMIN'), getAllReservations);

module.exports = router;
