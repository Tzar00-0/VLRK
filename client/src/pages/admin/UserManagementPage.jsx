import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getRoleText, getRoleColor } from '../../lib/utils';
import { Users, Plus, Edit, Search, Loader2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin User Management Page
// =============================================================================

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const emptyForm = { nama: '', email: '', password: '', role: 'SISWA' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ nama: user.nama, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        const payload = { nama: form.nama, email: form.email, role: form.role };
        await api.put(`/admin/users/${editing.id}`, payload);
        toast.success('Pengguna berhasil diperbarui.');
      } else {
        await api.post('/admin/users', form);
        toast.success('Pengguna berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { statusAktif: !user.statusAktif });
      toast.success(`Pengguna berhasil di${user.statusAktif ? 'nonaktifkan' : 'aktifkan'}.`);
      fetchUsers();
    } catch (err) {
      toast.error('Gagal mengubah status pengguna.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Pengguna</h1>
          <p className="text-slate-400 mt-1">Tambah, edit, dan kelola akun pengguna</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Semua Role</option>
          <option value="SISWA">Siswa</option>
          <option value="PENDAMPING">Pendamping</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="table-header">Nama</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Reservasi</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`table-row ${!user.statusAktif ? 'opacity-50' : ''}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-xs">
                        {user.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{user.nama}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-400">{user.email}</td>
                  <td className="table-cell">
                    <span className={`badge ${getRoleColor(user.role)}`}>{getRoleText(user.role)}</span>
                  </td>
                  <td className="table-cell text-slate-400">{user._count?.reservations || 0}</td>
                  <td className="table-cell">
                    <span className={user.statusAktif ? 'badge-approved' : 'badge-cancelled'}>
                      {user.statusAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`p-2 rounded-lg transition-colors ${user.statusAktif ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-emerald-500/20 text-emerald-400'}`}
                        title={user.statusAktif ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {user.statusAktif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Nama Lengkap</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          {!editing && (
            <div>
              <label className="input-label">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required minLength={6} placeholder="Minimal 6 karakter" />
            </div>
          )}
          <div>
            <label className="input-label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="SISWA">Siswa</option>
              <option value="PENDAMPING">Pendamping</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editing ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
