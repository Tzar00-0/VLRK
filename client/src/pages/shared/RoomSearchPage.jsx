import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStatusBadgeClass, getStatusText, formatDateShort } from '../../lib/utils';
import { Building2, Clock, Users, Search, MapPin, Layers, Wifi, Monitor, Wind } from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Room Search Page
// =============================================================================

const facilityIcons = {
  'proyektor': Monitor,
  'AC': Wind,
  'whiteboard': Layers,
  'sound system': Wifi,
  'komputer': Monitor,
};

const RoomSearchPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    kapasitasMin: '',
    gedung: '',
  });
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.tanggal) params.append('tanggal', filters.tanggal);
      if (filters.jamMulai) params.append('jamMulai', filters.jamMulai);
      if (filters.jamSelesai) params.append('jamSelesai', filters.jamSelesai);
      if (filters.kapasitasMin) params.append('kapasitasMin', filters.kapasitasMin);
      if (filters.gedung) params.append('gedung', filters.gedung);

      const endpoint = filters.tanggal && filters.jamMulai && filters.jamSelesai
        ? `/rooms/available?${params}`
        : `/rooms?${params}`;

      const res = await api.get(endpoint);
      setRooms(res.data.data);
    } catch (err) {
      toast.error('Gagal mencari ruang.');
    } finally {
      setLoading(false);
    }
  };

  // Load all rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const res = await api.get('/rooms');
        setRooms(res.data.data);
      } catch (err) {
        toast.error('Gagal memuat data ruang.');
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Cari Ruang Tersedia</h1>
        <p className="text-slate-400 mt-1">Temukan ruang yang tersedia sesuai kebutuhan Anda</p>
      </div>

      {/* Search Filters */}
      <form onSubmit={handleSearch} className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="input-label">Tanggal</label>
            <input
              type="date"
              value={filters.tanggal}
              onChange={(e) => setFilters({ ...filters, tanggal: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Jam Mulai</label>
            <input
              type="time"
              value={filters.jamMulai}
              onChange={(e) => setFilters({ ...filters, jamMulai: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Jam Selesai</label>
            <input
              type="time"
              value={filters.jamSelesai}
              onChange={(e) => setFilters({ ...filters, jamSelesai: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Min. Kapasitas</label>
            <input
              type="number"
              value={filters.kapasitasMin}
              onChange={(e) => setFilters({ ...filters, kapasitasMin: e.target.value })}
              placeholder="10"
              min="1"
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Gedung</label>
            <select
              value={filters.gedung}
              onChange={(e) => setFilters({ ...filters, gedung: e.target.value })}
              className="input-field"
            >
              <option value="">Semua Gedung</option>
              <option value="Gedung A">Gedung A</option>
              <option value="Gedung B">Gedung B</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn-primary">
            <Search className="w-4 h-4" />
            Cari Ruang
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : rooms.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {searched ? 'Tidak ada ruang tersedia' : 'Mulai pencarian'}
          </h3>
          <p className="text-slate-500">
            {searched
              ? 'Coba ubah filter pencarian Anda untuk menemukan ruang yang tersedia.'
              : 'Gunakan filter di atas untuk mencari ruang yang sesuai kebutuhan.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="glass-card-hover overflow-hidden group">
              {/* Room image */}
              <div className="h-44 overflow-hidden relative">
                <img
                  src={room.fotoUrl || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'}
                  alt={room.namaRuang}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="badge bg-emerald-500/80 text-white border-0">Tersedia</span>
                </div>
              </div>
              {/* Room info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{room.namaRuang}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {room.gedung}, Lt. {room.lantai}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {room.kapasitas} orang
                  </span>
                </div>
                {/* Fasilitas */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(room.fasilitas || []).map((f, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSearchPage;
