// =============================================================================
// VLRK - Admin Routes
// =============================================================================
// All routes here are admin-only (protected by authenticate + authorize('ADMIN'))
// =============================================================================

const express = require('express');
const router = express.Router();
const {
  approveReservation,
  rejectReservation,
  getAuditLogs,
  getUsers,
  createUser,
  updateUser,
  getStatsSummary,
  getStatsRooms,
  getStatsMonthly,
  exportReservations,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { approvalRules, createUserRules, updateUserRules, validate } = require('../middleware/validate');

// Apply auth + admin role to ALL routes in this router
router.use(authenticate, authorize('ADMIN'));

// Approval
router.patch('/reservations/:id/approve', approvalRules, validate, approveReservation);
router.patch('/reservations/:id/reject', approvalRules, validate, rejectReservation);

// Audit trail
router.get('/audit-logs', getAuditLogs);

// User management
router.get('/users', getUsers);
router.post('/users', createUserRules, validate, createUser);
router.put('/users/:id', updateUserRules, validate, updateUser);

// Statistics
router.get('/stats/summary', getStatsSummary);
router.get('/stats/rooms', getStatsRooms);
router.get('/stats/monthly', getStatsMonthly);
router.get('/stats/export', exportReservations);

module.exports = router;
