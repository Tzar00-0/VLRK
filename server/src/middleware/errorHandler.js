// =============================================================================
// VLRK - Error Handler Middleware
// =============================================================================
// Global error handler for consistent error responses
// =============================================================================

const errorHandler = (err, req, res, _next) => {
  console.error('❌ Error:', err);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada. Terdapat konflik dengan data yang sudah tersimpan.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan.',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal.',
      errors: err.errors,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
