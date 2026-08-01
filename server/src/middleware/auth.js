// =============================================================================
// VLRK - Authentication & RBAC Middleware
// =============================================================================
// Two middleware functions:
// 1. authenticate — verifies JWT token and attaches user to request
// 2. authorize   — checks if user's role is in the allowed list
//
// RBAC Logic:
// - Every protected endpoint must use authenticate() first
// - Then optionally authorize('ADMIN') or authorize('SISWA', 'PENDAMPING')
// - If role doesn't match, returns 403 Forbidden
// =============================================================================

const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/db');

/**
 * authenticate — JWT verification middleware
 * 
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT signature and check expiration
 * 3. Look up user in database by decoded userId
 * 4. Check if user account is still active (statusAktif)
 * 5. Attach full user object (minus password) to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Step 1: Extract token from "Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Step 2: Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token telah kadaluarsa. Silakan login kembali.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
    }

    // Step 3: Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        statusAktif: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Step 4: Check if account is still active
    if (!user.statusAktif) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
      });
    }

    // Step 5: Attach user to request object for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi.',
    });
  }
};

/**
 * authorize — Role-based access control middleware
 * 
 * Usage: authorize('ADMIN') or authorize('SISWA', 'PENDAMPING')
 * Must be used AFTER authenticate middleware
 * 
 * @param  {...string} allowedRoles - Roles that are allowed to access the endpoint
 * @returns Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by authenticate middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.',
      });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya ${allowedRoles.join(', ')} yang dapat mengakses resource ini.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
