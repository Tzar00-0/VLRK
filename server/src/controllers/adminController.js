// =============================================================================
// VLRK - Admin Controller
// =============================================================================
// Admin-specific operations: approval, user management, audit trail, statistics
// =============================================================================

const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { sendReservationEmail } = require('../utils/email');

// =============================================================================
// APPROVAL
// =============================================================================

/**
 * PATCH /api/admin/reservations/:id/approve
 * Approve a pending reservation
 * 
 * Re-validates no time conflict at approval time (another reservation could 
 * have been approved since this one was submitted)
 */
const approveReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { catatan } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        room: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
    }

    if (reservation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Reservasi tidak dapat disetujui karena statusnya sudah "${reservation.status}".`,
      });
    }

    // =========================================================================
    // RE-VALIDATE CONFLICT AT APPROVAL TIME
    // =========================================================================
    // Another reservation may have been approved since this one was created.
    // We must check again to prevent double-booking.
    // =========================================================================
    // Build day-range from the reservation's stored date (SQLite stores full datetime)
    const resDate = new Date(reservation.tanggal);
    resDate.setHours(0, 0, 0, 0);
    const resDateEnd = new Date(resDate);
    resDateEnd.setDate(resDateEnd.getDate() + 1);

    const conflict = await prisma.reservation.findFirst({
      where: {
        id: { not: id },
        roomId: reservation.roomId,
        tanggal: { gte: resDate, lt: resDateEnd },
        status: 'DISETUJUI',
        AND: [
          { jamMulai: { lt: reservation.jamSelesai } },
          { jamSelesai: { gt: reservation.jamMulai } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Tidak dapat menyetujui: terdapat konflik jadwal dengan reservasi lain yang sudah disetujui.',
      });
    }

    // Approve and create audit log in a transaction
    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: { status: 'DISETUJUI' },
        include: {
          user: { select: { nama: true, email: true } },
          room: { select: { namaRuang: true, gedung: true } },
        },
      }),
      prisma.approvalLog.create({
        data: {
          reservationId: id,
          adminId: req.user.id,
          aksi: 'SETUJU',
          catatan,
        },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          reservationId: id,
          tipe: 'APPROVAL',
          pesan: `Reservasi "${reservation.namaKegiatan}" telah disetujui.`,
        },
      }),
    ]);

    // Send email notification (non-blocking)
    sendReservationEmail(reservation.user, reservation, reservation.room, 'DISETUJUI', catatan)
      .catch(err => console.error('Email send error:', err));

    res.json({
      success: true,
      message: 'Reservasi berhasil disetujui.',
      data: updated,
    });
  } catch (error) {
    console.error('Approve reservation error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyetujui reservasi.' });
  }
};

/**
 * PATCH /api/admin/reservations/:id/reject
 * Reject a pending reservation with optional catatan (reason)
 */
const rejectReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { catatan } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { user: true, room: true },
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservasi tidak ditemukan.' });
    }

    if (reservation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Reservasi tidak dapat ditolak karena statusnya sudah "${reservation.status}".`,
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id },
        data: { status: 'DITOLAK' },
        include: {
          user: { select: { nama: true, email: true } },
          room: { select: { namaRuang: true, gedung: true } },
        },
      }),
      prisma.approvalLog.create({
        data: {
          reservationId: id,
          adminId: req.user.id,
          aksi: 'TOLAK',
          catatan,
        },
      }),
      prisma.notification.create({
        data: {
          userId: reservation.userId,
          reservationId: id,
          tipe: 'REJECTION',
          pesan: `Reservasi "${reservation.namaKegiatan}" ditolak.${catatan ? ` Alasan: ${catatan}` : ''}`,
        },
      }),
    ]);

    // Send email notification (non-blocking)
    sendReservationEmail(reservation.user, reservation, reservation.room, 'DITOLAK', catatan)
      .catch(err => console.error('Email send error:', err));

    res.json({
      success: true,
      message: 'Reservasi berhasil ditolak.',
      data: updated,
    });
  } catch (error) {
    console.error('Reject reservation error:', error);
    res.status(500).json({ success: false, message: 'Gagal menolak reservasi.' });
  }
};

// =============================================================================
// AUDIT TRAIL
// =============================================================================

/**
 * GET /api/admin/audit-logs
 * Get paginated audit trail
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, aksi, adminId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (aksi) where.aksi = aksi;
    if (adminId) where.adminId = parseInt(adminId);

    const [logs, total] = await Promise.all([
      prisma.approvalLog.findMany({
        where,
        include: {
          admin: { select: { nama: true, email: true } },
          reservation: {
            include: {
              user: { select: { nama: true, email: true, role: true } },
              room: { select: { namaRuang: true, gedung: true } },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.approvalLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil audit trail.' });
  }
};

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/users
 * List all users (with optional role filter)
 */
const getUsers = async (req, res) => {
  try {
    const { role, statusAktif, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (statusAktif !== undefined) where.statusAktif = statusAktif === 'true';
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        statusAktif: true,
        createdAt: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
  }
};

/**
 * POST /api/admin/users
 * Create a new user
 */
const createUser = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { nama, email, passwordHash, role },
      select: { id: true, nama: true, email: true, role: true, statusAktif: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      message: 'Pengguna berhasil ditambahkan.',
      data: user,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan pengguna.' });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user details (name, email, role, status)
 */
const updateUser = async (req, res) => {
  try {
    const { nama, email, role, statusAktif } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(nama && { nama }),
        ...(email && { email }),
        ...(role && { role }),
        ...(statusAktif !== undefined && { statusAktif }),
      },
      select: { id: true, nama: true, email: true, role: true, statusAktif: true, createdAt: true },
    });

    res.json({
      success: true,
      message: 'Pengguna berhasil diperbarui.',
      data: user,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email sudah digunakan oleh pengguna lain.' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna.' });
  }
};

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * GET /api/admin/stats/summary
 * Get dashboard summary statistics
 */
const getStatsSummary = async (req, res) => {
  try {
    const [
      totalReservations,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      totalRooms,
      activeRooms,
      totalUsers,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count({ where: { status: 'DISETUJUI' } }),
      prisma.reservation.count({ where: { status: 'DITOLAK' } }),
      prisma.reservation.count({ where: { status: 'DIBATALKAN' } }),
      prisma.room.count(),
      prisma.room.count({ where: { status: 'AKTIF' } }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        reservations: {
          total: totalReservations,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          cancelled: cancelledCount,
        },
        rooms: { total: totalRooms, active: activeRooms },
        users: { total: totalUsers },
      },
    });
  } catch (error) {
    console.error('Stats summary error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik.' });
  }
};

/**
 * GET /api/admin/stats/rooms
 * Get room utilization ranking
 */
const getStatsRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'AKTIF' },
      include: {
        _count: {
          select: { reservations: true },
        },
        reservations: {
          where: { status: 'DISETUJUI' },
          select: { id: true },
        },
      },
      orderBy: { namaRuang: 'asc' },
    });

    const roomStats = rooms.map(room => ({
      id: room.id,
      namaRuang: room.namaRuang,
      gedung: room.gedung,
      totalReservasi: room._count.reservations,
      reservasiDisetujui: room.reservations.length,
    })).sort((a, b) => b.reservasiDisetujui - a.reservasiDisetujui);

    res.json({ success: true, data: roomStats });
  } catch (error) {
    console.error('Stats rooms error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik ruang.' });
  }
};

/**
 * GET /api/admin/stats/monthly
 * Get monthly reservation trend for the given year
 */
const getStatsMonthly = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const reservations = await prisma.reservation.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      select: { createdAt: true, status: true },
    });

    // Aggregate by month
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      bulan: i + 1,
      total: 0,
      disetujui: 0,
      ditolak: 0,
      pending: 0,
    }));

    reservations.forEach(r => {
      const month = r.createdAt.getMonth();
      monthly[month].total++;
      if (r.status === 'DISETUJUI') monthly[month].disetujui++;
      else if (r.status === 'DITOLAK') monthly[month].ditolak++;
      else if (r.status === 'PENDING') monthly[month].pending++;
    });

    res.json({ success: true, data: monthly });
  } catch (error) {
    console.error('Stats monthly error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik bulanan.' });
  }
};

/**
 * GET /api/admin/stats/export
 * Export reservations to CSV
 */
const exportReservations = async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: { select: { nama: true, email: true, role: true } },
        room: { select: { namaRuang: true, gedung: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const headers = ['ID', 'Pengaju', 'Email', 'Role', 'Ruang', 'Gedung', 'Kegiatan', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Peserta', 'Status', 'Prioritas', 'Dibuat'];
    const rows = reservations.map(r => [
      r.id,
      r.user.nama,
      r.user.email,
      r.user.role,
      r.room.namaRuang,
      r.room.gedung,
      `"${r.namaKegiatan}"`,
      r.tanggal.toISOString().split('T')[0],
      r.jamMulai,
      r.jamSelesai,
      r.jumlahPeserta,
      r.status,
      r.prioritas,
      r.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reservasi-vlrk.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengexport data.' });
  }
};

module.exports = {
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
};
