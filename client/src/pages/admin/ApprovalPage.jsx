import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  getStatusBadgeClass, getStatusText, getPriorityBadgeClass, getPriorityText,
  formatDateShort, getRoleText, getRoleColor
} from '../../lib/utils';
import {
  CheckCircle2, XCircle, Eye, Building2, CalendarDays, Clock,
  Users, ArrowUpDown, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin Approval Queue Page
// =============================================================================

const ApprovalPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/reservations${params}`);
      setReservations(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat data pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await api.patch(`/admin/reservations/${id}/approve`, { catatan: '' });
      toast.success('Reservasi berhasil disetujui!');
      setShowDetail(false);
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui reservasi.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReservation) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/reservations/${selectedReservation.id}/reject`, { catatan });
      toast.success('Reservasi berhasil ditolak.');
      setShowRejectModal(false);
      setShowDetail(false);
      setCatatan('');
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak reservasi.');
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (r) => {
    setSelectedReservation(r);
    setShowDetail(true);
  };

  const openReject = (r) => {
    setSelectedReservation(r);
    setCatatan('');
    setShowRejectModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Approval Reservasi</h1>
        <p className="text-slate-400 mt-1">Kelola pengajuan reservasi dari siswa dan pendamping</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN', ''].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
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

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : reservations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">Tidak ada pengajuan</h3>
          <p className="text-slate-500 mt-1">Belum ada pengajuan dengan status yang dipilih.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="table-header">Prioritas</th>
                  <th className="table-header">Kegiatan</th>
                  <th className="table-header">Pengaju</th>
                  <th className="table-header">Ruang</th>
                  <th className="table-header">Jadwal</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell">
                      <span className={getPriorityBadgeClass(r.prioritas)}>
                        {getPriorityText(r.prioritas)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium text-white">{r.namaKegiatan}</p>
                      <p className="text-xs text-slate-500">{r.jumlahPeserta} peserta</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-slate-300">{r.user?.nama}</p>
                      <span className={`badge text-[10px] ${getRoleColor(r.user?.role)}`}>
                        {getRoleText(r.user?.role)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-slate-300">{r.room?.namaRuang}</p>
                      <p className="text-xs text-slate-500">{r.room?.gedung}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-slate-300">{formatDateShort(r.tanggal)}</p>
                      <p className="text-xs text-slate-500">{r.jamMulai} - {r.jamSelesai}</p>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadgeClass(r.status)}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(r)}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Setujui"
                              disabled={processing}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReject(r)}
                              className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Tolak"
                              disabled={processing}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Reservasi" size="md">
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Kegiatan</span>
                <p className="font-medium text-white">{selectedReservation.namaKegiatan}</p>
              </div>
              <div>
                <span className="text-slate-500">Pengaju</span>
                <p className="font-medium text-white">{selectedReservation.user?.nama}</p>
                <span className={`badge text-[10px] mt-0.5 ${getRoleColor(selectedReservation.user?.role)}`}>
                  {getRoleText(selectedReservation.user?.role)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Ruang</span>
                <p className="font-medium text-white">{selectedReservation.room?.namaRuang}</p>
                <p className="text-xs text-slate-500">{selectedReservation.room?.gedung}, Lt. {selectedReservation.room?.lantai}</p>
              </div>
              <div>
                <span className="text-slate-500">Jadwal</span>
                <p className="font-medium text-white">{formatDateShort(selectedReservation.tanggal)}</p>
                <p className="text-xs text-slate-400">{selectedReservation.jamMulai} - {selectedReservation.jamSelesai}</p>
              </div>
              <div>
                <span className="text-slate-500">Jumlah Peserta</span>
                <p className="font-medium text-white">{selectedReservation.jumlahPeserta} orang</p>
              </div>
              <div>
                <span className="text-slate-500">Prioritas</span>
                <p><span className={getPriorityBadgeClass(selectedReservation.prioritas)}>{getPriorityText(selectedReservation.prioritas)}</span></p>
              </div>
            </div>
            {selectedReservation.keterangan && (
              <div className="text-sm">
                <span className="text-slate-500">Keterangan</span>
                <p className="text-slate-300 mt-1 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  {selectedReservation.keterangan}
                </p>
              </div>
            )}
            {selectedReservation.status === 'PENDING' && (
              <div className="flex gap-3 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => handleApprove(selectedReservation.id)}
                  className="btn-success flex-1"
                  disabled={processing}
                >
                  <CheckCircle2 className="w-4 h-4" /> Setujui
                </button>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    openReject(selectedReservation);
                  }}
                  className="btn-danger flex-1"
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Tolak Reservasi" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Tolak reservasi "<strong className="text-white">{selectedReservation?.namaKegiatan}</strong>"?
          </p>
          <div>
            <label className="input-label">Catatan / Alasan Penolakan</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis alasan penolakan (opsional)..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRejectModal(false)} className="btn-secondary flex-1">
              Batal
            </button>
            <button onClick={handleReject} className="btn-danger flex-1" disabled={processing}>
              <XCircle className="w-4 h-4" /> Tolak Reservasi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalPage;
