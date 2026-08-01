// =============================================================================
// VLRK - Express Server Entry Point
// =============================================================================
// Sets up Express with middleware, routes, and error handling
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
app.use(helmet());                                    // Security headers
app.use(cors({ origin: config.clientUrl, credentials: true })); // CORS for frontend
app.use(morgan('dev'));                               // Request logging
app.use(express.json());                              // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));       // Parse URL-encoded bodies

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VLRK API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ---------------------------------------------------------------------------
// 404 Handler
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} tidak ditemukan.`,
  });
});

// ---------------------------------------------------------------------------
// Error Handler
// ---------------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(config.port, () => {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  🏫 VLRK — VL Reservasi Kelas API');
  console.log(`  📡 Server running on port ${config.port}`);
  console.log(`  🌍 Environment: ${config.nodeEnv}`);
  console.log(`  🔗 Frontend URL: ${config.clientUrl}`);
  console.log('══════════════════════════════════════════════');
  console.log('');
});

module.exports = app;
