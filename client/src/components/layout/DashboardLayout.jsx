import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// =============================================================================
// VLRK - Dashboard Layout
// =============================================================================
// Wraps all authenticated pages with sidebar navigation
// =============================================================================

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      {/* Main content area — left padding accounts for sidebar width */}
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
