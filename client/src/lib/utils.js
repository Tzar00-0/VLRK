// =============================================================================
// VLRK - Utility Helpers
// =============================================================================

/**
 * Format date to Indonesian locale string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format short date
 */
export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status badge class
 */
export const getStatusBadgeClass = (status) => {
  const map = {
    PENDING: 'badge-pending',
    DISETUJUI: 'badge-approved',
    DITOLAK: 'badge-rejected',
    DIBATALKAN: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
};

/**
 * Get status display text
 */
export const getStatusText = (status) => {
  const map = {
    PENDING: 'Menunggu',
    DISETUJUI: 'Disetujui',
    DITOLAK: 'Ditolak',
    DIBATALKAN: 'Dibatalkan',
  };
  return map[status] || status;
};

/**
 * Get priority badge class
 */
export const getPriorityBadgeClass = (priority) => {
  return priority === 'TINGGI' ? 'badge-high' : 'badge-normal';
};

/**
 * Get priority display text
 */
export const getPriorityText = (priority) => {
  return priority === 'TINGGI' ? 'Tinggi' : 'Normal';
};

/**
 * Get role display text
 */
export const getRoleText = (role) => {
  const map = {
    SISWA: 'Siswa',
    PENDAMPING: 'Pendamping',
    ADMIN: 'Admin',
  };
  return map[role] || role;
};

/**
 * Get role color classes
 */
export const getRoleColor = (role) => {
  const map = {
    SISWA: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    PENDAMPING: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    ADMIN: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  };
  return map[role] || '';
};

/**
 * Get dashboard path based on role
 */
export const getDashboardPath = (role) => {
  const map = {
    SISWA: '/siswa/dashboard',
    PENDAMPING: '/pendamping/dashboard',
    ADMIN: '/admin/dashboard',
  };
  return map[role] || '/login';
};

/**
 * Indonesian month names
 */
export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
