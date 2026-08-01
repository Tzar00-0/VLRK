// =============================================================================
// VLRK - Auth Routes
// =============================================================================

const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRules, validate } = require('../middleware/validate');

// POST /api/auth/login — Login with email & password
router.post('/login', loginRules, validate, login);

// GET /api/auth/me — Get current user profile (requires auth)
router.get('/me', authenticate, getProfile);

module.exports = router;
