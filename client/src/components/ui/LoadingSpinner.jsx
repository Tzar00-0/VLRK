import { Loader2 } from 'lucide-react';

// =============================================================================
// VLRK - Loading Spinner Component
// =============================================================================

const LoadingSpinner = ({ size = 'md', text = 'Memuat...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
