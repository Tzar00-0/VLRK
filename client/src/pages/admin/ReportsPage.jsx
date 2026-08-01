import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import { BULAN } from '../../lib/utils';
import {
  BarChart3, PieChart, TrendingUp, Download, CalendarDays, CheckCircle2,
  XCircle, Clock, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import toast from 'react-hot-toast';

// =============================================================================
// VLRK - Admin Reports & Statistics Page
// =============================================================================

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#64748b', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [roomStats, setRoomStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const [summaryRes, roomsRes, monthlyRes] = await Promise.all([
        api.get('/admin/stats/summary'),
        api.get('/admin/stats/rooms'),
        api.get(`/admin/stats/monthly?year=${year}`),
      ]);
      setStats(summaryRes.data.data);
      setRoomStats(roomsRes.data.data);
      setMonthlyStats(monthlyRes.data.data);
    } catch (err) {
      toast.error('Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/stats/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reservasi-vlrk.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data berhasil diexport!');
    } catch (err) {
      toast.error('Gagal mengexport data.');
    }
  };

  if (loading) return <LoadingSpinner />;

  const pieData = stats ? [
    { name: 'Disetujui', value: stats.reservations.approved },
    { name: 'Pending', value: stats.reservations.pending },
    { name: 'Ditolak', value: stats.reservations.rejected },
    { name: 'Dibatalkan', value: stats.reservations.cancelled },
  ].filter(d => d.value > 0) : [];

  const monthlyChartData = monthlyStats.map(m => ({
    name: BULAN[m.bulan - 1]?.substring(0, 3),
    total: m.total,
    disetujui: m.disetujui,
    ditolak: m.ditolak,
    pending: m.pending,
  }));

  const roomChartData = roomStats.slice(0, 8).map(r => ({
    name: r.namaRuang,
    value: r.reservasiDisetujui,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan & Statistik</h1>
          <p className="text-slate-400 mt-1">Analisis data utilisasi ruang dan reservasi</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => { setYear(parseInt(e.target.value)); setLoading(true); }}
            className="input-field w-auto"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-primary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reservasi" value={stats?.reservations?.total || 0} icon={CalendarDays} color="primary" delay={0} />
        <StatCard title="Disetujui" value={stats?.reservations?.approved || 0} icon={CheckCircle2} color="success" delay={100} />
        <StatCard title="Ditolak" value={stats?.reservations?.rejected || 0} icon={XCircle} color="danger" delay={200} />
        <StatCard title="Menunggu" value={stats?.reservations?.pending || 0} icon={Clock} color="warning" delay={300} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Line Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Tren Reservasi Bulanan ({year})
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Total" />
                <Line type="monotone" dataKey="disetujui" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Disetujui" />
                <Line type="monotone" dataKey="ditolak" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} name="Ditolak" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Distribusi Status
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Utilization Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Utilisasi Ruang (Reservasi Disetujui)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roomChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Reservasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Stats Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" />
            Detail Utilisasi Per Ruang
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="table-header">#</th>
                <th className="table-header">Ruang</th>
                <th className="table-header">Gedung</th>
                <th className="table-header">Total Reservasi</th>
                <th className="table-header">Disetujui</th>
                <th className="table-header">Tingkat Utilisasi</th>
              </tr>
            </thead>
            <tbody>
              {roomStats.map((room, i) => {
                const utilization = room.totalReservasi > 0
                  ? Math.round((room.reservasiDisetujui / room.totalReservasi) * 100)
                  : 0;
                return (
                  <tr key={room.id} className="table-row">
                    <td className="table-cell text-slate-500 font-medium">{i + 1}</td>
                    <td className="table-cell font-medium text-white">{room.namaRuang}</td>
                    <td className="table-cell text-slate-400">{room.gedung}</td>
                    <td className="table-cell text-slate-400">{room.totalReservasi}</td>
                    <td className="table-cell text-emerald-400 font-medium">{room.reservasiDisetujui}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-10">{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
