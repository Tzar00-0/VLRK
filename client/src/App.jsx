import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import UserDashboard from './pages/shared/UserDashboard';
import RoomSearchPage from './pages/shared/RoomSearchPage';
import ReservationFormPage from './pages/shared/ReservationFormPage';
import ReservationHistoryPage from './pages/shared/ReservationHistoryPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalPage from './pages/admin/ApprovalPage';
import RoomManagementPage from './pages/admin/RoomManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AuditTrailPage from './pages/admin/AuditTrailPage';
import ReportsPage from './pages/admin/ReportsPage';

// =============================================================================
// VLRK - App Component (Route Definitions)
// =============================================================================

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Siswa routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['SISWA']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/siswa/dashboard" element={<UserDashboard />} />
            <Route path="/siswa/cari-ruang" element={<RoomSearchPage />} />
            <Route path="/siswa/ajukan" element={<ReservationFormPage />} />
            <Route path="/siswa/riwayat" element={<ReservationHistoryPage />} />
          </Route>

          {/* Pendamping routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['PENDAMPING']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/pendamping/dashboard" element={<UserDashboard />} />
            <Route path="/pendamping/cari-ruang" element={<RoomSearchPage />} />
            <Route path="/pendamping/ajukan" element={<ReservationFormPage />} />
            <Route path="/pendamping/riwayat" element={<ReservationHistoryPage />} />
          </Route>

          {/* Admin routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/approval" element={<ApprovalPage />} />
            <Route path="/admin/ruang" element={<RoomManagementPage />} />
            <Route path="/admin/pengguna" element={<UserManagementPage />} />
            <Route path="/admin/audit" element={<AuditTrailPage />} />
            <Route path="/admin/laporan" element={<ReportsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#ffffff' },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
