import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: '',
  };
  
  return (
    <div className={`bg-white rounded-lg border border-border shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

