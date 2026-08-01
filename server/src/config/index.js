// =============================================================================
// VLRK - Server Configuration
// =============================================================================
// Centralized configuration loaded from environment variables
// =============================================================================

require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'vlrk-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'VLRK <noreply@vlrk.com>',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
