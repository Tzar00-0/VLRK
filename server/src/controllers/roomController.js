// =============================================================================
// VLRK - Room Controller
// =============================================================================
// CRUD operations for rooms + availability search
//
// SQLite note: `fasilitas` is stored as a JSON string (e.g. '["AC","proyektor"]')
// We parse it on read and stringify it on write.
// =============================================================================

const prisma = require('../config/db');

// Helper: parse fasilitas JSON string to array
const parseFasilitas = (room) => ({
  ...room,
  fasilitas: (() => { try { return JSON.parse(room.fasilitas || '[]'); } catch { return []; } })(),
});

/**
 * GET /api/rooms
 * List rooms with optional filters.
 * Query params: gedung, lantai, kapasitasMin, fasilitas (comma-separated), status
 */
const getRooms = async (req, res) => {
  try {
    const { gedung, lantai, kapasitasMin, fasilitas, status } = req.query;

    const where = {};
    if (gedung) where.gedung = gedung;
    if (lantai) where.lantai = parseInt(lantai);
    if (kapasitasMin) where.kapasitas = { gte: parseInt(kapasitasMin) };
    // Default to active rooms unless status explicitly passed
    where.status = status || 'AKTIF';
    if (status === '') delete where.status; // allow empty string = all

    let rooms = await prisma.room.findMany({
      where,
      orderBy: [{ gedung: 'asc' }, { lantai: 'asc' }, { namaRuang: 'asc' }],
    });

    rooms = rooms.map(parseFasilitas);

    // Post-query filter by fasilitas (SQLite JSON stored as string)
    if (fasilitas) {
      const required = fasilitas.split(',').map(f => f.trim().toLowerCase());
      rooms = rooms.filter(room =>
        required.every(f => room.fasilitas.map(x => x.toLowerCase()).includes(f))
      );
    }

    res.json({ success: true, data: rooms, total: rooms.length });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data ruang.' });
  }
};

/**
 * GET /api/rooms/available
 * Search available rooms for a specific date & time slot.
 *
 * AVAILABILITY LOGIC:
 * ─────────────────────────────────────────────────────────
 * Two time slots [A_start, A_end) and [B_start, B_end) OVERLAP when:
 *   A_start < B_end  AND  A_end > B_start
 *
 * We only check against DISETUJUI reservations — pending ones haven't
 * been confirmed yet so they don't block a slot.
 * ─────────────────────────────────────────────────────────
 */
const getAvailableRooms = async (req, res) => {
  try {
    const { tanggal, jamMulai, jamSelesai, kapasitasMin, gedung, lantai, fasilitas } = req.query;

    if (!tanggal || !jamMulai || !jamSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tanggal, jamMulai, dan jamSelesai wajib diisi.',
      });
    }

    // Step 1: get all active rooms matching basic filters
    const roomWhere = { status: 'AKTIF' };
    if (gedung) roomWhere.gedung = gedung;
    if (lantai) roomWhere.lantai = parseInt(lantai);
    if (kapasitasMin) roomWhere.kapasitas = { gte: parseInt(kapasitasMin) };

    let rooms = (await prisma.room.findMany({ where: roomWhere })).map(parseFasilitas);

    // Filter by fasilitas
    if (fasilitas) {
      const required = fasilitas.split(',').map(f => f.trim().toLowerCase());
      rooms = rooms.filter(room =>
        required.every(f => room.fasilitas.map(x => x.toLowerCase()).includes(f))
      );
    }

    // Step 2: find which rooms are already booked (DISETUJUI) for this date + time
    const targetDate = new Date(tanggal);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const conflicting = await prisma.reservation.findMany({
      where: {
        status: 'DISETUJUI',
        tanggal: { gte: targetDate, lt: nextDay },
        // Overlap: existing.jamMulai < reqEnd  AND  existing.jamSelesai > reqStart
        AND: [
          { jamMulai: { lt: jamSelesai } },
          { jamSelesai: { gt: jamMulai } },
        ],
      },
      select: { roomId: true },
    });

    const occupiedIds = new Set(conflicting.map(r => r.roomId));

    // Step 3: keep only unoccupied rooms
    const available = rooms.filter(r => !occupiedIds.has(r.id));

    res.json({ success: true, data: available, total: available.length });
  } catch (error) {
    console.error('Available rooms error:', error);
    res.status(500).json({ success: false, message: 'Gagal mencari ruang tersedia.' });
  }
};

/**
 * GET /api/rooms/:id
 * Room detail with upcoming approved reservations.
 */
const getRoomById = async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reservations: {
          where: {
            status: 'DISETUJUI',
            tanggal: { gte: new Date() },
          },
          select: {
            id: true, namaKegiatan: true, tanggal: true,
            jamMulai: true, jamSelesai: true, jumlahPeserta: true,
            user: { select: { nama: true } },
          },
          orderBy: [{ tanggal: 'asc' }, { jamMulai: 'asc' }],
        },
      },
    });

    if (!room) return res.status(404).json({ success: false, message: 'Ruang tidak ditemukan.' });

    res.json({ success: true, data: parseFasilitas(room) });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail ruang.' });
  }
};

/**
 * GET /api/rooms/:id/calendar?month=YYYY-MM
 * Calendar events for FullCalendar / react-big-calendar.
 */
const getRoomCalendar = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { month } = req.query;
    if (!month) return res.status(400).json({ success: false, message: 'Parameter month wajib (format: YYYY-MM).' });

    const [year, mon] = month.split('-').map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0, 23, 59, 59);

    const reservations = await prisma.reservation.findMany({
      where: {
        roomId,
        status: { in: ['DISETUJUI', 'PENDING'] },
        tanggal: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { nama: true, role: true } } },
      orderBy: [{ tanggal: 'asc' }, { jamMulai: 'asc' }],
    });

    const events = reservations.map(r => ({
      id: r.id,
      title: r.namaKegiatan,
      start: `${r.tanggal.toISOString().split('T')[0]}T${r.jamMulai}`,
      end:   `${r.tanggal.toISOString().split('T')[0]}T${r.jamSelesai}`,
      status: r.status,
      user: r.user.nama,
      role: r.user.role,
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Room calendar error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kalender.' });
  }
};

/**
 * POST /api/rooms  (Admin only)
 */
const createRoom = async (req, res) => {
  try {
    const { namaRuang, gedung, lantai, kapasitas, fasilitas, fotoUrl } = req.body;
    const room = await prisma.room.create({
      data: {
        namaRuang, gedung,
        lantai: parseInt(lantai),
        kapasitas: parseInt(kapasitas),
        fasilitas: JSON.stringify(Array.isArray(fasilitas) ? fasilitas : []),
        fotoUrl: fotoUrl || null,
      },
    });
    res.status(201).json({ success: true, message: 'Ruang berhasil ditambahkan.', data: parseFasilitas(room) });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan ruang.' });
  }
};

/**
 * PUT /api/rooms/:id  (Admin only)
 */
const updateRoom = async (req, res) => {
  try {
    const { namaRuang, gedung, lantai, kapasitas, fasilitas, fotoUrl, status } = req.body;
    const room = await prisma.room.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(namaRuang  !== undefined && { namaRuang }),
        ...(gedung     !== undefined && { gedung }),
        ...(lantai     !== undefined && { lantai: parseInt(lantai) }),
        ...(kapasitas  !== undefined && { kapasitas: parseInt(kapasitas) }),
        ...(fasilitas  !== undefined && { fasilitas: JSON.stringify(Array.isArray(fasilitas) ? fasilitas : []) }),
        ...(fotoUrl    !== undefined && { fotoUrl }),
        ...(status     !== undefined && { status }),
      },
    });
    res.json({ success: true, message: 'Ruang berhasil diperbarui.', data: parseFasilitas(room) });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui ruang.' });
  }
};

/**
 * DELETE /api/rooms/:id  (Admin only) — soft delete
 */
const deleteRoom = async (req, res) => {
  try {
    await prisma.room.update({ where: { id: parseInt(req.params.id) }, data: { status: 'NONAKTIF' } });
    res.json({ success: true, message: 'Ruang berhasil dinonaktifkan.' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, message: 'Gagal menonaktifkan ruang.' });
  }
};

module.exports = { getRooms, getAvailableRooms, getRoomById, getRoomCalendar, createRoom, updateRoom, deleteRoom };
