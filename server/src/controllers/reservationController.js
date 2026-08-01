// =============================================================================
// VLRK - Reservation Controller
// =============================================================================
// Handles reservation CRUD with conflict detection
// =============================================================================

const prisma = require('../config/db');
const { sendReservationEmail } = require('../utils/email');

/**
 * POST /api/reservations
 * Create a new reservation request
 * 
 * CONFLICT DETECTION LOGIC (critical business rule):
 * -------------------------------------------------
 * Before creating a reservation, we check for time conflicts:
 * 1. Query all DISETUJUI (approved) reservations for the same room & date
 * 2. A conflict exists when: newStart < existingEnd AND newEnd > existingStart
 * 3. If conflict → return 409 with details of the conflicting reservation
 * 4. If no conflict → create with status PENDING
 * 
 * Priority is automatically assigned based on user role:
 * - PENDAMPING → TINGGI (high priority in approval queue)
 * - SISWA → NORMAL
 */
const createReservation = async (req, res) => {
  try {
    const { roomId, namaKegiatan, tanggal, jamMulai, jamSelesai, jumlahPeserta, keterangan } = req.body;
    const userId = req.user.id;

    // Validate time order: jamMulai must be before jamSelesai
    if (jamMulai >= jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Jam mulai harus sebelum jam selesai.',
      });
    }

    // Check if room exists and is active
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status === 'NONAKTIF') {
      return res.status(404).json({
        success: false,
        message: 'Ruang tidak ditemukan atau sudah tidak aktif.',
      });
    }

    // Check capacity
    if (jumlahPeserta > room.kapasitas) {
      return res.status(400).json({
        success: false,
        message: `Jumlah peserta (${jumlahPeserta}) melebihi kapasitas ruang (${room.kapasitas}).`,
      });
    }

    // =========================================================================
    // CONFLICT DETECTION
    // =========================================================================
    // Check for overlapping APPROVED reservations on the same room & date.
    // Two time intervals [A_start, A_end) and [B_start, B_end) overlap when:
    //   A_start < B_end AND A_end > B_start
    // =========================================================================
    // Build day range for the target date (SQLite stores full datetime)
    const targetDate = new Date(tanggal);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const conflicting = await prisma.reservation.findFirst({
      where: {
        roomId,
        tanggal: { gte: targetDate, lt: nextDay },
        status: 'DISETUJUI',
        AND: [
          { jamMulai: { lt: jamSelesai } },   // existing starts before new ends
          { jamSelesai: { gt: jamMulai } },    // existing ends after new starts
        ],
      },
      include: {
        user: { select: { nama: true } },
      },
    });

    if (conflicting) {
      return res.status(409).json({
        success: false,
        message: 'Terdapat konflik jadwal dengan reservasi yang sudah disetujui.',
        conflict: {
          id: conflicting.id,
          namaKegiatan: conflicting.namaKegiatan,
          jamMulai: conflicting.jamMulai,
          jamSelesai: conflicting.jamSelesai,
          pengaju: conflicting.user.nama,
        },
      });
    }

    // Set priority based on role
    const prioritas = req.user.role === 'PENDAMPING' ? 'TINGGI' : 'NORMAL';

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        namaKegiatan,
        tanggal: new Date(tanggal),
        jamMulai,
        jamSelesai,
        jumlahPeserta,
        keterangan,
        prioritas,
      },
      include: {
        room: { select: { namaRuang: true, gedung: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Reservasi berhasil diajukan. Menunggu persetujuan admin.',
      data: reservation,
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengajukan reservasi.' });
  }
};

/**
 * GET /api/reservations/my
 * Get current user's reservations
 */
const getMyReservations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          room: { select: { namaRuang: true, gedung: true, lantai: true } },
          approvalLogs: {
            include: { admin: { select: { nama: true } } },
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.reservation.count({ where }),
    ]);

    res.json({
      success: true,
      data: reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get my reservations error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data reservasi.' });
  }
};

/**
 * PATCH /api/reservations/:id/cancel
 * Cancel own pending reservation
 */
const cancelReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Only allow cancelling own PENDING reservations
    const reservation = await prisma.reservation.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
    }

    if (reservation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Hanya reservasi dengan status PENDING yang dapat dibatalkan.',
      });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'DIBATALKAN' },
    });

    res.json({
      success: true,
      message: 'Reservasi berhasil dibatalkan.',
      data: updated,
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ success: false, message: 'Gagal membatalkan reservasi.' });
  }
};

/**
 * GET /api/reservations (Admin)
 * List all reservations with filters
 */
const getAllReservations = async (req, res) => {
  try {
    const { status, roomId, userId, tanggal, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (roomId) where.roomId = parseInt(roomId);
    if (userId) where.userId = parseInt(userId);
    if (tanggal) {
      const d = new Date(tanggal);
      d.setHours(0, 0, 0, 0);
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 1);
      where.tanggal = { gte: d, lt: nd };
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { id: true, nama: true, email: true, role: true } },
          room: { select: { id: true, namaRuang: true, gedung: true, lantai: true } },
          approvalLogs: {
            include: { admin: { select: { nama: true } } },
            orderBy: { timestamp: 'desc' },
          },
        },
        // Sort: TINGGI priority first, then by creation date
        orderBy: [{ prioritas: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.reservation.count({ where }),
    ]);

    res.json({
      success: true,
      data: reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data reservasi.' });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
};
