interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'progress' | 'warning' | 'error' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  const variants = {
    success: 'bg-status-success/10 text-status-success border-status-success/20',
    progress: 'bg-status-progress/10 text-status-progress border-status-progress/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    error: 'bg-status-error/10 text-status-error border-status-error/20',
    neutral: 'bg-status-neutral/10 text-status-neutral border-status-neutral/20',
    primary: 'bg-primary-cta/10 text-primary-cta border-primary-cta/20',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

