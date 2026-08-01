// =============================================================================
// VLRK - Validation Middleware
// =============================================================================
// Request validation rules using express-validator
// =============================================================================

const { body, query, param, validationResult } = require('express-validator');

/**
 * Runs validation and returns errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal.',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// ---------------------------------------------------------------------------
// Auth Validations
// ---------------------------------------------------------------------------

const loginRules = [
  body('email')
    .isEmail().withMessage('Format email tidak valid.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password wajib diisi.'),
];

// ---------------------------------------------------------------------------
// Room Validations
// ---------------------------------------------------------------------------

const createRoomRules = [
  body('namaRuang').notEmpty().withMessage('Nama ruang wajib diisi.'),
  body('gedung').notEmpty().withMessage('Gedung wajib diisi.'),
  body('lantai').isInt({ min: 1 }).withMessage('Lantai harus berupa angka positif.'),
  body('kapasitas').isInt({ min: 1 }).withMessage('Kapasitas harus berupa angka positif.'),
  body('fasilitas').optional().isArray().withMessage('Fasilitas harus berupa array.'),
  body('fotoUrl').optional().isURL().withMessage('URL foto tidak valid.'),
];

const updateRoomRules = [
  param('id').isInt().withMessage('ID ruang tidak valid.'),
  body('namaRuang').optional().notEmpty().withMessage('Nama ruang tidak boleh kosong.'),
  body('gedung').optional().notEmpty().withMessage('Gedung tidak boleh kosong.'),
  body('lantai').optional().isInt({ min: 1 }).withMessage('Lantai harus berupa angka positif.'),
  body('kapasitas').optional().isInt({ min: 1 }).withMessage('Kapasitas harus berupa angka positif.'),
  body('fasilitas').optional().isArray().withMessage('Fasilitas harus berupa array.'),
  body('fotoUrl').optional().isURL().withMessage('URL foto tidak valid.'),
  body('status').optional().isIn(['AKTIF', 'NONAKTIF']).withMessage('Status harus AKTIF atau NONAKTIF.'),
];

// ---------------------------------------------------------------------------
// Reservation Validations
// ---------------------------------------------------------------------------

const createReservationRules = [
  body('roomId').isInt().withMessage('ID ruang tidak valid.'),
  body('namaKegiatan').notEmpty().withMessage('Nama kegiatan wajib diisi.'),
  body('tanggal').isISO8601().withMessage('Format tanggal tidak valid (gunakan YYYY-MM-DD).'),
  body('jamMulai')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Format jam mulai tidak valid (gunakan HH:mm).'),
  body('jamSelesai')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Format jam selesai tidak valid (gunakan HH:mm).'),
  body('jumlahPeserta').isInt({ min: 1 }).withMessage('Jumlah peserta harus minimal 1.'),
  body('keterangan').optional().isString(),
];

// ---------------------------------------------------------------------------
// Approval Validations
// ---------------------------------------------------------------------------

const approvalRules = [
  param('id').isInt().withMessage('ID reservasi tidak valid.'),
  body('catatan').optional().isString(),
];

// ---------------------------------------------------------------------------
// User Management Validations
// ---------------------------------------------------------------------------

const createUserRules = [
  body('nama').notEmpty().withMessage('Nama wajib diisi.'),
  body('email').isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('role').isIn(['SISWA', 'PENDAMPING', 'ADMIN']).withMessage('Role tidak valid.'),
];

const updateUserRules = [
  param('id').isInt().withMessage('ID pengguna tidak valid.'),
  body('nama').optional().notEmpty().withMessage('Nama tidak boleh kosong.'),
  body('email').optional().isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
  body('role').optional().isIn(['SISWA', 'PENDAMPING', 'ADMIN']).withMessage('Role tidak valid.'),
  body('statusAktif').optional().isBoolean().withMessage('Status aktif harus boolean.'),
];

module.exports = {
  validate,
  loginRules,
  createRoomRules,
  updateRoomRules,
  createReservationRules,
  approvalRules,
  createUserRules,
  updateUserRules,
};
