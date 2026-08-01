import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStatusBadgeClass, getStatusText, formatDateShort } from '../../lib/utils';
import { CalendarSearch, FilePlus, History, Clock, CalendarDays, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Student/Pendamping Dashboard
// =============================================================================

const UserDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const prefix = user?.role === 'PENDAMPING' ? '/pendamping' : '/siswa';

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/my?limit=5');
      setReservations(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat data reservasi.');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'PENDING').length,
    approved: reservations.filter(r => r.status === 'DISETUJUI').length,
    rejected: reservations.filter(r => r.status === 'DITOLAK').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Selamat datang, <span className="text-gradient">{user?.nama}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">
          {user?.role === 'PENDAMPING'
            ? 'Kelola reservasi kelas tambahan dan pengganti Anda.'
            : 'Ajukan dan pantau reservasi ruang kelas Anda.'
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reservasi" value={stats.total} icon={CalendarDays} color="primary" delay={0} />
        <StatCard title="Menunggu" value={stats.pending} icon={Clock} color="warning" delay={100} />
        <StatCard title="Disetujui" value={stats.approved} icon={CalendarSearch} color="success" delay={200} />
        <StatCard title="Ditolak" value={stats.rejected} icon={History} color="danger" delay={300} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={`${prefix}/cari-ruang`} className="glass-card-hover p-5 group">
          <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400 w-fit mb-3 group-hover:scale-110 transition-transform">
            <CalendarSearch className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-white mb-1">Cari Ruang</h3>
          <p className="text-sm text-slate-400">Temukan ruang tersedia sesuai kebutuhan</p>
        </Link>
        <Link to={`${prefix}/ajukan`} className="glass-card-hover p-5 group">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
            <FilePlus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-white mb-1">Ajukan Reservasi</h3>
          <p className="text-sm text-slate-400">Buat pengajuan reservasi ruang baru</p>
        </Link>
        <Link to={`${prefix}/riwayat`} className="glass-card-hover p-5 group">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 w-fit mb-3 group-hover:scale-110 transition-transform">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-white mb-1">Riwayat Saya</h3>
          <p className="text-sm text-slate-400">Lihat status semua pengajuan Anda</p>
        </Link>
      </div>

      {/* Recent Reservations */}
      <div className="glass-card">
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Reservasi Terbaru</h2>
          <Link to={`${prefix}/riwayat`} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            Lihat semua →
          </Link>
        </div>
        {reservations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada reservasi. Mulai dengan mengajukan reservasi baru!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {reservations.map((r) => (
              <div key={r.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{r.namaKegiatan}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      {r.room?.namaRuang} — {r.room?.gedung}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateShort(r.tanggal)} • {r.jamMulai} - {r.jamSelesai}
                    </p>
                  </div>
                  <span className={getStatusBadgeClass(r.status)}>
                    {getStatusText(r.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
