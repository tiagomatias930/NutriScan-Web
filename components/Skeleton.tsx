import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-glassMedium';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-lg rounded-3xl p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2">
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} />
        </div>
      </div>
      <Skeleton width={60} height={24} />
    </div>
    <Skeleton height={8} className="mb-4" />
    <div className="grid grid-cols-2 gap-3">
      <Skeleton height={48} />
      <Skeleton height={48} />
    </div>
  </div>
);

export const SkeletonMealItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-sm p-3 rounded-2xl flex items-center gap-4 ${className}`}>
    <Skeleton variant="rectangular" width={64} height={64} />
    <div className="flex-1 space-y-2">
      <Skeleton width="70%" height={16} />
      <div className="flex gap-2">
        <Skeleton width={50} height={24} />
        <Skeleton width={50} height={24} />
        <Skeleton width={50} height={24} />
      </div>
    </div>
    <Skeleton width={50} height={28} />
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="p-6 pb-28 space-y-6 max-w-xl mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between pt-4">
      <div className="space-y-2">
        <Skeleton width={100} height={14} />
        <Skeleton width={150} height={32} />
      </div>
      <Skeleton variant="circular" width={40} height={40} />
    </div>

    {/* Calories Card */}
    <SkeletonCard />

    {/* Hydration Card */}
    <div className="glass-lg rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={80} height={14} />
            <Skeleton width={60} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={24} />
      </div>
      <Skeleton height={12} />
      <div className="flex gap-3">
        <Skeleton height={44} className="flex-1" />
        <Skeleton height={44} className="flex-1" />
      </div>
    </div>

    {/* Recent Activity */}
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={24} />
      </div>
      <SkeletonMealItem />
      <SkeletonMealItem />
      <SkeletonMealItem />
    </div>
  </div>
);

export default Skeleton;