import { useState, useEffect } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getStatusBadgeClass, getStatusText, formatDateShort, BULAN } from '../../lib/utils';
import {
  CalendarDays, Clock, CheckSquare, XCircle, Building2, Users,
  TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin Dashboard
// =============================================================================

const CHART_COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#64748b'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [roomStats, setRoomStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, roomsRes, monthlyRes, reservationsRes] = await Promise.all([
        api.get('/admin/stats/summary'),
        api.get('/admin/stats/rooms'),
        api.get('/admin/stats/monthly'),
        api.get('/reservations?limit=5&status=PENDING'),
      ]);
      setStats(summaryRes.data.data);
      setRoomStats(roomsRes.data.data);
      setMonthlyStats(monthlyRes.data.data);
      setRecentReservations(reservationsRes.data.data);
    } catch (err) {
      toast.error('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const pieData = stats ? [
    { name: 'Disetujui', value: stats.reservations.approved },
    { name: 'Pending', value: stats.reservations.pending },
    { name: 'Ditolak', value: stats.reservations.rejected },
    { name: 'Dibatalkan', value: stats.reservations.cancelled },
  ].filter(d => d.value > 0) : [];

  const barData = monthlyStats.map(m => ({
    name: BULAN[m.bulan - 1]?.substring(0, 3),
    total: m.total,
    disetujui: m.disetujui,
    ditolak: m.ditolak,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-slate-400 mt-1">Ringkasan data dan statistik reservasi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reservasi" value={stats?.reservations?.total || 0} icon={CalendarDays} color="primary" delay={0} />
        <StatCard title="Menunggu Approval" value={stats?.reservations?.pending || 0} icon={Clock} color="warning" delay={100} />
        <StatCard title="Ruang Aktif" value={stats?.rooms?.active || 0} icon={Building2} color="success" delay={200} />
        <StatCard title="Total Pengguna" value={stats?.users?.total || 0} icon={Users} color="danger" delay={300} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Tren Reservasi Bulanan
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disetujui" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Status Reservasi
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Utilization & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rooms */}
        <div className="glass-card">
          <div className="p-5 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Ruang Paling Populer
            </h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {roomStats.slice(0, 5).map((room, i) => (
              <div key={room.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white text-sm">{room.namaRuang}</p>
                    <p className="text-xs text-slate-500">{room.gedung}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary-400">{room.reservasiDisetujui} reservasi</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card">
          <div className="p-5 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Menunggu Persetujuan
            </h3>
          </div>
          {recentReservations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Tidak ada pengajuan pending.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {recentReservations.map((r) => (
                <div key={r.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white text-sm">{r.namaKegiatan}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.user?.nama} • {r.room?.namaRuang} • {formatDateShort(r.tanggal)}
                      </p>
                    </div>
                    <span className={r.prioritas === 'TINGGI' ? 'badge-high' : 'badge-pending'}>
                      {r.prioritas === 'TINGGI' ? 'Prioritas' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
