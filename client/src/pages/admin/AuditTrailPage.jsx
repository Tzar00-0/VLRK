import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDateTime, getRoleText, getRoleColor } from '../../lib/utils';
import { ScrollText, CheckCircle2, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin Audit Trail Page
// =============================================================================

const AuditTrailPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAksi, setFilterAksi] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [filterAksi, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAksi) params.append('aksi', filterAksi);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Gagal memuat audit trail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
        <p className="text-slate-400 mt-1">Riwayat semua aksi approval dan penolakan reservasi</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'SETUJU', 'TOLAK'].map(aksi => (
          <button
            key={aksi}
            onClick={() => { setFilterAksi(aksi); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterAksi === aksi
                ? 'bg-primary-600/30 text-primary-300 border border-primary-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
            }`}
          >
            {aksi === '' ? 'Semua' : aksi === 'SETUJU' ? '✅ Disetujui' : '❌ Ditolak'}
          </button>
        ))}
      </div>

      {/* Logs */}
      {loading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ScrollText className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">Belum ada log</h3>
          <p className="text-slate-500 mt-1">Audit trail akan muncul setelah ada aksi approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="glass-card p-4 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  log.aksi === 'SETUJU'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {log.aksi === 'SETUJU'
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <XCircle className="w-5 h-5" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{log.admin?.nama}</span>
                    <span className={`text-sm ${log.aksi === 'SETUJU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.aksi === 'SETUJU' ? 'menyetujui' : 'menolak'}
                    </span>
                    <span className="font-medium text-white">"{log.reservation?.namaKegiatan}"</span>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-400">
                    <span>Pengaju: {log.reservation?.user?.nama}</span>
                    <span className={`badge text-[10px] ${getRoleColor(log.reservation?.user?.role)}`}>
                      {getRoleText(log.reservation?.user?.role)}
                    </span>
                    <span>Ruang: {log.reservation?.room?.namaRuang}</span>
                  </div>

                  {log.catatan && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-slate-300">
                      <span className="text-slate-500 font-medium">Catatan:</span> {log.catatan}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-slate-400">
            Halaman {page} dari {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary text-sm"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
