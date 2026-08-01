import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Building2, CalendarDays, Clock, Users, FileText, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Reservation Form Page
// =============================================================================

const ReservationFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefix = user?.role === 'PENDAMPING' ? '/pendamping' : '/siswa';

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(null);

  const [form, setForm] = useState({
    roomId: '',
    namaKegiatan: '',
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    jumlahPeserta: '',
    keterangan: '',
  });

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setRooms(res.data.data);
      } catch (err) {
        toast.error('Gagal memuat data ruang.');
      } finally {
        setLoadingRooms(false);
      }
    };
    loadRooms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setConflict(null); // Clear conflict on any change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setConflict(null);

    try {
      const payload = {
        ...form,
        roomId: parseInt(form.roomId),
        jumlahPeserta: parseInt(form.jumlahPeserta),
      };

      await api.post('/reservations', payload);
      toast.success('Reservasi berhasil diajukan! Menunggu persetujuan admin.');
      navigate(`${prefix}/riwayat`);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data.conflict);
        toast.error('Terdapat konflik jadwal!');
      } else {
        const msg = err.response?.data?.message || 'Gagal mengajukan reservasi.';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === parseInt(form.roomId));

  if (loadingRooms) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Ajukan Reservasi</h1>
        <p className="text-slate-400 mt-1">Isi form di bawah untuk mengajukan reservasi ruang kelas</p>
      </div>

      {/* Priority badge for pendamping */}
      {user?.role === 'PENDAMPING' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm">
          <span className="badge-high">Prioritas Tinggi</span>
          Pengajuan Anda akan diprioritaskan dalam antrean approval.
        </div>
      )}

      {/* Conflict warning */}
      {conflict && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span className="font-semibold">Konflik Jadwal!</span>
          </div>
          <p className="text-sm">
            Ruang ini sudah direservasi oleh <strong>{conflict.pengaju}</strong> untuk
            kegiatan "<strong>{conflict.namaKegiatan}</strong>" pada jam {conflict.jamMulai} - {conflict.jamSelesai}.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Nama Kegiatan */}
        <div>
          <label htmlFor="namaKegiatan" className="input-label flex items-center gap-2">
            <FileText className="w-4 h-4" /> Nama Kegiatan
          </label>
          <input
            id="namaKegiatan"
            name="namaKegiatan"
            value={form.namaKegiatan}
            onChange={handleChange}
            placeholder="Contoh: Rapat OSIS, Kelas Pengganti Fisika"
            className="input-field"
            required
          />
        </div>

        {/* Ruang */}
        <div>
          <label htmlFor="roomId" className="input-label flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Pilih Ruang
          </label>
          <select
            id="roomId"
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">— Pilih ruang —</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.namaRuang} — {room.gedung}, Lt.{room.lantai} (Kap. {room.kapasitas})
              </option>
            ))}
          </select>
          {selectedRoom && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(selectedRoom.fasilitas || []).map((f, i) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tanggal & Waktu */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tanggal" className="input-label flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Tanggal
            </label>
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              value={form.tanggal}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="jamMulai" className="input-label flex items-center gap-2">
              <Clock className="w-4 h-4" /> Jam Mulai
            </label>
            <input
              id="jamMulai"
              name="jamMulai"
              type="time"
              value={form.jamMulai}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor="jamSelesai" className="input-label flex items-center gap-2">
              <Clock className="w-4 h-4" /> Jam Selesai
            </label>
            <input
              id="jamSelesai"
              name="jamSelesai"
              type="time"
              value={form.jamSelesai}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Jumlah Peserta */}
        <div>
          <label htmlFor="jumlahPeserta" className="input-label flex items-center gap-2">
            <Users className="w-4 h-4" /> Jumlah Peserta
          </label>
          <input
            id="jumlahPeserta"
            name="jumlahPeserta"
            type="number"
            value={form.jumlahPeserta}
            onChange={handleChange}
            placeholder="Masukkan jumlah peserta"
            min="1"
            max={selectedRoom?.kapasitas || 999}
            className="input-field"
            required
          />
          {selectedRoom && (
            <p className="text-xs text-slate-500 mt-1">Kapasitas ruang: {selectedRoom.kapasitas} orang</p>
          )}
        </div>

        {/* Keterangan */}
        <div>
          <label htmlFor="keterangan" className="input-label">Keterangan (opsional)</label>
          <textarea
            id="keterangan"
            name="keterangan"
            value={form.keterangan}
            onChange={handleChange}
            placeholder="Tambahkan detail atau tujuan kegiatan..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`${prefix}/dashboard`)}
            className="btn-secondary flex-1"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengajukan...
              </>
            ) : (
              'Ajukan Reservasi'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationFormPage;
