// =============================================================================
// VLRK - Stat Card Component
// =============================================================================

const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle, delay = 0 }) => {
  const colorVariants = {
    primary: 'stat-card-primary',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    danger: 'stat-card-danger',
  };

  const iconColors = {
    primary: 'text-primary-400 bg-primary-500/20',
    success: 'text-emerald-400 bg-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/20',
    danger: 'text-rose-400 bg-rose-500/20',
  };

  return (
    <div
      className={`stat-card ${colorVariants[color]} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconColors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
