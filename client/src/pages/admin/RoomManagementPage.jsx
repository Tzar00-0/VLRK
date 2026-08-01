import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Building2, Plus, Edit, Trash2, MapPin, Users, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin Room Management Page
// =============================================================================

const RoomManagementPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    namaRuang: '', gedung: 'Gedung A', lantai: 1, kapasitas: 30,
    fasilitas: [], fotoUrl: '', status: 'AKTIF',
  };
  const [form, setForm] = useState(emptyForm);
  const [fasilitasInput, setFasilitasInput] = useState('');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms?status=');
      setRooms(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat data ruang.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFasilitasInput('');
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    setForm({
      namaRuang: room.namaRuang,
      gedung: room.gedung,
      lantai: room.lantai,
      kapasitas: room.kapasitas,
      fasilitas: room.fasilitas || [],
      fotoUrl: room.fotoUrl || '',
      status: room.status,
    });
    setFasilitasInput((room.fasilitas || []).join(', '));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      lantai: parseInt(form.lantai),
      kapasitas: parseInt(form.kapasitas),
      fasilitas: fasilitasInput.split(',').map(f => f.trim()).filter(Boolean),
    };

    try {
      if (editing) {
        await api.put(`/rooms/${editing.id}`, payload);
        toast.success('Ruang berhasil diperbarui.');
      } else {
        await api.post('/rooms', payload);
        toast.success('Ruang berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data ruang.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (room) => {
    const newStatus = room.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    try {
      await api.put(`/rooms/${room.id}`, { status: newStatus });
      toast.success(`Ruang berhasil di${newStatus === 'AKTIF' ? 'aktifkan' : 'nonaktifkan'}.`);
      fetchRooms();
    } catch (err) {
      toast.error('Gagal mengubah status ruang.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Ruang</h1>
          <p className="text-slate-400 mt-1">Tambah, edit, dan kelola data ruang kelas</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Ruang
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div key={room.id} className={`glass-card overflow-hidden ${room.status === 'NONAKTIF' ? 'opacity-60' : ''}`}>
            <div className="h-36 overflow-hidden relative">
              <img
                src={room.fotoUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'}
                alt={room.namaRuang}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
              <div className="absolute top-3 right-3">
                <span className={`badge ${room.status === 'AKTIF' ? 'badge-approved' : 'badge-cancelled'}`}>
                  {room.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white">{room.namaRuang}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{room.gedung}, Lt. {room.lantai}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.kapasitas}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(room.fasilitas || []).map((f, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">{f}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <button onClick={() => openEdit(room)} className="btn-ghost text-xs flex-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(room)}
                  className={`btn-ghost text-xs flex-1 ${room.status === 'AKTIF' ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                >
                  {room.status === 'AKTIF' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {room.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Ruang' : 'Tambah Ruang Baru'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Nama Ruang</label>
            <input
              value={form.namaRuang}
              onChange={(e) => setForm({ ...form, namaRuang: e.target.value })}
              placeholder="Contoh: Ruang 101"
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Gedung</label>
              <select
                value={form.gedung}
                onChange={(e) => setForm({ ...form, gedung: e.target.value })}
                className="input-field"
              >
                <option value="Gedung A">Gedung A</option>
                <option value="Gedung B">Gedung B</option>
              </select>
            </div>
            <div>
              <label className="input-label">Lantai</label>
              <input
                type="number"
                value={form.lantai}
                onChange={(e) => setForm({ ...form, lantai: e.target.value })}
                min="1"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">Kapasitas</label>
              <input
                type="number"
                value={form.kapasitas}
                onChange={(e) => setForm({ ...form, kapasitas: e.target.value })}
                min="1"
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="input-label">Fasilitas (pisahkan dengan koma)</label>
            <input
              value={fasilitasInput}
              onChange={(e) => setFasilitasInput(e.target.value)}
              placeholder="proyektor, AC, whiteboard, sound system"
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">URL Foto (opsional)</label>
            <input
              value={form.fotoUrl}
              onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
              placeholder="https://..."
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? 'Simpan Perubahan' : 'Tambah Ruang'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomManagementPage;
