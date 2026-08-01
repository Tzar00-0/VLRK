# VLRK — VL Reservasi Kelas

Sistem reservasi ruang kelas berbasis role untuk mengganti proses manual (WhatsApp/kertas) menjadi digital, real-time, dan transparan.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS v3
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + RBAC (Role-Based Access Control)
- **Charts**: Recharts
- **Icons**: Lucide React

## Prasyarat

- Node.js v18+
- PostgreSQL (running locally atau via Docker)

## Setup

### 1. Database

Pastikan PostgreSQL berjalan dan buat database:

```sql
CREATE DATABASE vlrk;
```

### 2. Server

```bash
cd server

# Copy environment file dan sesuaikan DATABASE_URL
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# Seed data contoh
npm run db:seed

# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### 3. Client

```bash
cd client

# Install dependencies
npm install

# Jalankan client
npm run dev
```

Client akan berjalan di `http://localhost:5173`

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vlrk.com | password123 |
| Pendamping | budi.pendamping@vlrk.com | password123 |
| Pendamping | sari.pendamping@vlrk.com | password123 |
| Siswa | andi.siswa@vlrk.com | password123 |
| Siswa | dewi.siswa@vlrk.com | password123 |
| Siswa | reza.siswa@vlrk.com | password123 |

## Fitur

- ✅ Login dengan role-based redirect
- ✅ Dashboard per role (Siswa, Pendamping, Admin)
- ✅ CRUD ruang kelas (Admin)
- ✅ Pencarian ruang tersedia dengan filter
- ✅ Pengajuan reservasi dengan validasi bentrok jadwal
- ✅ Approval/penolakan oleh Admin dengan catatan
- ✅ Prioritas Pendamping > Siswa dalam antrean
- ✅ Audit trail semua aksi approval
- ✅ Kelola akun pengguna (Admin)
- ✅ Statistik & laporan dengan chart
- ✅ Export data CSV
- ✅ Email notifikasi (console log di dev, SMTP di production)
- ✅ UI modern dengan dark theme & glassmorphism

## API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Profile

### Rooms
- `GET /api/rooms` — List ruang
- `GET /api/rooms/available` — Cari ruang tersedia
- `GET /api/rooms/:id` — Detail ruang
- `GET /api/rooms/:id/calendar` — Kalender ruang
- `POST /api/rooms` — Tambah ruang (admin)
- `PUT /api/rooms/:id` — Edit ruang (admin)
- `DELETE /api/rooms/:id` — Nonaktifkan ruang (admin)

### Reservations
- `POST /api/reservations` — Ajukan reservasi
- `GET /api/reservations/my` — Reservasi saya
- `PATCH /api/reservations/:id/cancel` — Batalkan
- `GET /api/reservations` — Semua reservasi (admin)

### Admin
- `PATCH /api/admin/reservations/:id/approve` — Setujui
- `PATCH /api/admin/reservations/:id/reject` — Tolak
- `GET /api/admin/audit-logs` — Audit trail
- `GET /api/admin/users` — List pengguna
- `POST /api/admin/users` — Tambah pengguna
- `PUT /api/admin/users/:id` — Edit pengguna
- `GET /api/admin/stats/summary` — Ringkasan
- `GET /api/admin/stats/rooms` — Utilisasi ruang
- `GET /api/admin/stats/monthly` — Tren bulanan
- `GET /api/admin/stats/export` — Export CSV
