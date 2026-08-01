// =============================================================================
// VLRK - Email Utility
// =============================================================================
// Sends notification emails using Nodemailer
// Falls back to console.log when SMTP is not configured (dev mode)
// =============================================================================

const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create SMTP transporter if credentials are configured
 * Returns null if SMTP is not configured (dev mode)
 */
const createTransporter = () => {
  if (!config.smtp.host || !config.smtp.user) {
    return null; // No SMTP configured — will log to console
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

/**
 * Send reservation status email to the user
 * 
 * @param {Object} user - User object { nama, email }
 * @param {Object} reservation - Reservation object
 * @param {Object} room - Room object { namaRuang, gedung }
 * @param {string} status - 'DISETUJUI' or 'DITOLAK'
 * @param {string|null} catatan - Admin's note (optional)
 */
const sendReservationEmail = async (user, reservation, room, status, catatan = null) => {
  const isApproved = status === 'DISETUJUI';
  const statusText = isApproved ? 'Disetujui ✅' : 'Ditolak ❌';
  const statusColor = isApproved ? '#059669' : '#e11d48';

  const subject = `[VLRK] Reservasi ${statusText} — ${reservation.namaKegiatan}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .status-badge { display: inline-block; padding: 8px 20px; border-radius: 24px; color: white; font-weight: bold; font-size: 16px; margin-top: 12px; background: ${statusColor}; }
        .content { padding: 24px; }
        .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { color: #64748b; font-weight: 600; min-width: 140px; }
        .detail-value { color: #1e293b; }
        .note { background: #f8fafc; border-left: 4px solid ${statusColor}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; padding: 16px; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VLRK — Reservasi Kelas</h1>
          <div class="status-badge">${statusText}</div>
        </div>
        <div class="content">
          <p>Halo <strong>${user.nama}</strong>,</p>
          <p>Reservasi Anda telah <strong>${isApproved ? 'disetujui' : 'ditolak'}</strong>. Berikut detailnya:</p>
          
          <div class="detail-row">
            <span class="detail-label">Kegiatan</span>
            <span class="detail-value">${reservation.namaKegiatan}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ruang</span>
            <span class="detail-value">${room.namaRuang} — ${room.gedung}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tanggal</span>
            <span class="detail-value">${new Date(reservation.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Waktu</span>
            <span class="detail-value">${reservation.jamMulai} — ${reservation.jamSelesai}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Jumlah Peserta</span>
            <span class="detail-value">${reservation.jumlahPeserta} orang</span>
          </div>

          ${catatan ? `
          <div class="note">
            <strong>Catatan dari Admin:</strong><br>
            ${catatan}
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Email ini dikirim otomatis oleh sistem VLRK. Jangan membalas email ini.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // Dev mode: log to console
    console.log('📧 ═══════════════════════════════════════════════');
    console.log(`📧 EMAIL (dev mode — SMTP not configured)`);
    console.log(`📧 To: ${user.email}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Status: ${statusText}`);
    console.log(`📧 Kegiatan: ${reservation.namaKegiatan}`);
    console.log(`📧 Ruang: ${room.namaRuang} — ${room.gedung}`);
    if (catatan) console.log(`📧 Catatan: ${catatan}`);
    console.log('📧 ═══════════════════════════════════════════════');
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: user.email,
    subject,
    html,
  });

  console.log(`📧 Email sent to ${user.email}: ${subject}`);
};

module.exports = { sendReservationEmail };
