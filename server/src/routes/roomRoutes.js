// =============================================================================
// VLRK - Room Routes
// =============================================================================

const express = require('express');
const router = express.Router();
const {
  getRooms,
  getAvailableRooms,
  getRoomById,
  getRoomCalendar,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');
const { createRoomRules, updateRoomRules, validate } = require('../middleware/validate');

// Public-ish routes (require auth but any role)
router.get('/', authenticate, getRooms);
router.get('/available', authenticate, getAvailableRooms);
router.get('/:id', authenticate, getRoomById);
router.get('/:id/calendar', authenticate, getRoomCalendar);

// Admin-only routes
router.post('/', authenticate, authorize('ADMIN'), createRoomRules, validate, createRoom);
router.put('/:id', authenticate, authorize('ADMIN'), updateRoomRules, validate, updateRoom);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteRoom);

module.exports = router;
