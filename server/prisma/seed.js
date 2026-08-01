// =============================================================================
// VLRK - Database Seed Script (SQLite compatible)
// =============================================================================
// Creates sample data for development:
// - 1 admin, 2 pendamping, 3 siswa accounts
// - 8 sample rooms across 2 buildings
// - Sample reservations in various statuses
// - Approval logs for approved/rejected reservations
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper: serialise fasilitas array to JSON string (SQLite stores as text)
const fas = (arr) => JSON.stringify(arr);

async function main() {
  console.log('🌱 Checking database status...');
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('🌱 Database already has data. Skipping seed.');
    return;
  }
  console.log('🌱 Seeding database...');

  // ---------------------------------------------------------------------------
  // 1. Users
  // ---------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vlrk.com' },
    update: {},
    create: { nama: 'Administrator', email: 'admin@vlrk.com', passwordHash, role: 'ADMIN' },
  });

  const pendamping1 = await prisma.user.upsert({
    where: { email: 'budi.pendamping@vlrk.com' },
    update: {},
    create: { nama: 'Budi Santoso', email: 'budi.pendamping@vlrk.com', passwordHash, role: 'PENDAMPING' },
  });

  const pendamping2 = await prisma.user.upsert({
    where: { email: 'sari.pendamping@vlrk.com' },
    update: {},
    create: { nama: 'Sari Wulandari', email: 'sari.pendamping@vlrk.com', passwordHash, role: 'PENDAMPING' },
  });

  const siswa1 = await prisma.user.upsert({
    where: { email: 'andi.siswa@vlrk.com' },
    update: {},
    create: { nama: 'Andi Pratama', email: 'andi.siswa@vlrk.com', passwordHash, role: 'SISWA' },
  });

  const siswa2 = await prisma.user.upsert({
    where: { email: 'dewi.siswa@vlrk.com' },
    update: {},
    create: { nama: 'Dewi Anggraini', email: 'dewi.siswa@vlrk.com', passwordHash, role: 'SISWA' },
  });

  const siswa3 = await prisma.user.upsert({
    where: { email: 'reza.siswa@vlrk.com' },
    update: {},
    create: { nama: 'Reza Firmansyah', email: 'reza.siswa@vlrk.com', passwordHash, role: 'SISWA' },
  });

  console.log('✅ Users created');

  // ---------------------------------------------------------------------------
  // 2. Rooms — fasilitas stored as JSON string for SQLite compatibility
  // ---------------------------------------------------------------------------
  const rooms = [];

  const roomData = [
    { namaRuang: 'Ruang 101', gedung: 'Gedung A', lantai: 1, kapasitas: 30, fasilitas: fas(['proyektor','AC','whiteboard','sound system']), fotoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800' },
    { namaRuang: 'Ruang 102', gedung: 'Gedung A', lantai: 1, kapasitas: 20, fasilitas: fas(['proyektor','AC','whiteboard']), fotoUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800' },
    { namaRuang: 'Ruang 201', gedung: 'Gedung A', lantai: 2, kapasitas: 40, fasilitas: fas(['proyektor','AC','whiteboard','sound system','mic wireless']), fotoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800' },
    { namaRuang: 'Ruang 202', gedung: 'Gedung A', lantai: 2, kapasitas: 25, fasilitas: fas(['proyektor','AC']), fotoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800' },
    { namaRuang: 'Lab Komputer 1', gedung: 'Gedung B', lantai: 1, kapasitas: 35, fasilitas: fas(['proyektor','AC','komputer','whiteboard']), fotoUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800' },
    { namaRuang: 'Lab Komputer 2', gedung: 'Gedung B', lantai: 1, kapasitas: 30, fasilitas: fas(['proyektor','AC','komputer']), fotoUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800' },
    { namaRuang: 'Aula Serbaguna', gedung: 'Gedung B', lantai: 2, kapasitas: 100, fasilitas: fas(['proyektor','AC','sound system','mic wireless','panggung']), fotoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' },
    { namaRuang: 'Ruang Diskusi', gedung: 'Gedung B', lantai: 2, kapasitas: 10, fasilitas: fas(['whiteboard','AC']), fotoUrl: 'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800' },
  ];

  for (const rd of roomData) {
    const room = await prisma.room.create({ data: rd });
    rooms.push(room);
  }

  console.log('✅ Rooms created');

  // ---------------------------------------------------------------------------
  // 3. Reservations
  // ---------------------------------------------------------------------------
  const futureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const reservations = [];

  const reservationData = [
    { userId: pendamping1.id, roomId: rooms[0].id, namaKegiatan: 'Kelas Pengganti Matematika', tanggal: futureDate(2), jamMulai: '08:00', jamSelesai: '10:00', jumlahPeserta: 25, keterangan: 'Penggantian kelas yang libur minggu lalu', status: 'DISETUJUI', prioritas: 'TINGGI' },
    { userId: siswa1.id, roomId: rooms[1].id, namaKegiatan: 'Rapat OSIS', tanggal: futureDate(3), jamMulai: '13:00', jamSelesai: '15:00', jumlahPeserta: 15, keterangan: 'Rapat koordinasi kegiatan bulan depan', status: 'PENDING', prioritas: 'NORMAL' },
    { userId: siswa2.id, roomId: rooms[2].id, namaKegiatan: 'Belajar Kelompok Fisika', tanggal: futureDate(1), jamMulai: '10:00', jamSelesai: '12:00', jumlahPeserta: 8, keterangan: 'Persiapan ujian semester', status: 'DITOLAK', prioritas: 'NORMAL' },
    { userId: pendamping2.id, roomId: rooms[3].id, namaKegiatan: 'Kelas Tambahan Bahasa Inggris', tanggal: futureDate(4), jamMulai: '14:00', jamSelesai: '16:00', jumlahPeserta: 20, keterangan: 'Persiapan TOEFL', status: 'PENDING', prioritas: 'TINGGI' },
    { userId: siswa3.id, roomId: rooms[4].id, namaKegiatan: 'Latihan Presentasi', tanggal: futureDate(5), jamMulai: '09:00', jamSelesai: '11:00', jumlahPeserta: 5, keterangan: 'Latihan untuk lomba debat', status: 'DIBATALKAN', prioritas: 'NORMAL' },
    { userId: siswa1.id, roomId: rooms[6].id, namaKegiatan: 'Pentas Seni Tahunan', tanggal: futureDate(7), jamMulai: '08:00', jamSelesai: '17:00', jumlahPeserta: 80, keterangan: 'Kegiatan pentas seni akhir tahun', status: 'PENDING', prioritas: 'NORMAL' },
    { userId: pendamping1.id, roomId: rooms[0].id, namaKegiatan: 'Kelas Pengganti IPA', tanggal: futureDate(6), jamMulai: '10:00', jamSelesai: '12:00', jumlahPeserta: 28, keterangan: 'Kelas IPA yang tertunda', status: 'DISETUJUI', prioritas: 'TINGGI' },
  ];

  for (const rd of reservationData) {
    const r = await prisma.reservation.create({ data: rd });
    reservations.push(r);
  }

  console.log('✅ Reservations created');

  // ---------------------------------------------------------------------------
  // 4. Approval Logs
  // ---------------------------------------------------------------------------
  await prisma.approvalLog.create({
    data: { reservationId: reservations[0].id, adminId: admin.id, aksi: 'SETUJU', catatan: 'Disetujui karena kebutuhan kelas pengganti yang mendesak.' },
  });
  await prisma.approvalLog.create({
    data: { reservationId: reservations[2].id, adminId: admin.id, aksi: 'TOLAK', catatan: 'Ruang sudah digunakan untuk kegiatan lain pada jam tersebut.' },
  });
  await prisma.approvalLog.create({
    data: { reservationId: reservations[6].id, adminId: admin.id, aksi: 'SETUJU', catatan: 'Disetujui. Pastikan ruang dikembalikan dalam kondisi bersih.' },
  });

  console.log('✅ Approval logs created');
  console.log('');
  console.log('🎉 Seeding selesai!');
  console.log('');
  console.log('📋 Akun Demo:');
  console.log('   Admin:      admin@vlrk.com / password123');
  console.log('   Pendamping: budi.pendamping@vlrk.com / password123');
  console.log('   Pendamping: sari.pendamping@vlrk.com / password123');
  console.log('   Siswa:      andi.siswa@vlrk.com / password123');
  console.log('   Siswa:      dewi.siswa@vlrk.com / password123');
  console.log('   Siswa:      reza.siswa@vlrk.com / password123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
