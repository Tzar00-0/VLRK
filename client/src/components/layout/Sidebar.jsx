import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, CalendarSearch, FilePlus, History, Users, Building2,
  CheckSquare, FileBarChart, ScrollText, LogOut, Menu, X, ChevronLeft, School
} from 'lucide-react';
import { getRoleText, getRoleColor } from '../../lib/utils';

// =============================================================================
// VLRK - Sidebar Navigation
// =============================================================================

const Sidebar = () => {
  const { user, logout, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items per role
  const menuItems = {
    SISWA: [
      { path: '/siswa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/siswa/cari-ruang', icon: CalendarSearch, label: 'Cari Ruang' },
      { path: '/siswa/ajukan', icon: FilePlus, label: 'Ajukan Reservasi' },
      { path: '/siswa/riwayat', icon: History, label: 'Riwayat Saya' },
    ],
    PENDAMPING: [
      { path: '/pendamping/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pendamping/cari-ruang', icon: CalendarSearch, label: 'Cari Ruang' },
      { path: '/pendamping/ajukan', icon: FilePlus, label: 'Ajukan Reservasi' },
      { path: '/pendamping/riwayat', icon: History, label: 'Riwayat Saya' },
    ],
    ADMIN: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/approval', icon: CheckSquare, label: 'Approval' },
      { path: '/admin/ruang', icon: Building2, label: 'Kelola Ruang' },
      { path: '/admin/pengguna', icon: Users, label: 'Pengguna' },
      { path: '/admin/audit', icon: ScrollText, label: 'Audit Trail' },
      { path: '/admin/laporan', icon: FileBarChart, label: 'Laporan' },
    ],
  };

  const items = menuItems[user?.role] || [];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 
        transition-all duration-300 flex flex-col ${collapsed ? 'w-[72px]' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
          <School className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-white tracking-tight">VLRK</h1>
            <p className="text-[10px] text-slate-500 font-medium">Reservasi Kelas</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User info */}
      <div className={`p-4 border-b border-slate-800 ${collapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
            {user?.nama?.charAt(0)?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.nama}</p>
              <span className={`badge text-[10px] mt-0.5 ${getRoleColor(user?.role)}`}>
                {getRoleText(user?.role)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'text-white bg-primary-600/20 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200
            ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
