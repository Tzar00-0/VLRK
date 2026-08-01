import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStatusBadgeClass, getStatusText, formatDateShort } from '../../lib/utils';
import { Building2, CalendarDays, Clock, XCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Reservation History Page
// =============================================================================

const ReservationHistoryPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/reservations/my${params}`);
      setReservations(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat riwayat reservasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) return;

    try {
      await api.patch(`/reservations/${id}/cancel`);
      toast.success('Reservasi berhasil dibatalkan.');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan reservasi.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Riwayat Reservasi</h1>
          <p className="text-slate-400 mt-1">Semua pengajuan reservasi Anda</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN'].map(status => (
          <button
            key={status}
            onClick={() => { setFilter(status); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === status
                ? 'bg-primary-600/30 text-primary-300 border border-primary-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
            }`}
          >
            {status === '' ? 'Semua' : getStatusText(status)}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <History className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Belum ada reservasi</h3>
          <p className="text-slate-500">Riwayat reservasi Anda akan tampil di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="glass-card p-5 hover:bg-slate-800/40 transition-colors animate-slide-up">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">{r.namaKegiatan}</h3>
                    <span className={getStatusBadgeClass(r.status)}>{getStatusText(r.status)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      {r.room?.namaRuang} — {r.room?.gedung}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-slate-500" />
                      {formatDateShort(r.tanggal)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {r.jamMulai} - {r.jamSelesai}
                    </span>
                  </div>
                  {/* Show admin note if rejected */}
                  {r.approvalLogs?.[0]?.catatan && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm">
                      <span className="text-slate-500 font-medium">Catatan Admin: </span>
                      <span className="text-slate-300">{r.approvalLogs[0].catatan}</span>
                    </div>
                  )}
                </div>
                {/* Cancel button for PENDING */}
                {r.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="btn-ghost text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex-shrink-0"
                    title="Batalkan"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Batalkan</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationHistoryPage;
