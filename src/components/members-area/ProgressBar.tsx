/**
 * ProgressBar - Animated progress bar with multiple variants
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'striped';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'top';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  labelPosition = 'outside',
  animated = true,
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  const roundedPercent = Math.round(percent);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-primary',
    gradient: 'bg-gradient-to-r from-primary via-primary/80 to-primary',
    striped: 'bg-primary bg-stripes',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Top Label */}
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">{roundedPercent}%</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Progress Track */}
        <div
          className={cn(
            'flex-1 bg-muted rounded-full overflow-hidden',
            sizeClasses[size]
          )}
        >
          <motion.div
            initial={animated ? { width: 0 } : false}
            animate={{ width: `${percent}%` }}
            transition={{ 
              duration: animated ? 0.6 : 0, 
              ease: 'easeOut',
              delay: animated ? 0.1 : 0,
            }}
            className={cn(
              'h-full rounded-full transition-colors',
              variantClasses[variant],
              variant === 'striped' && 'animate-stripes'
            )}
          />
        </div>

        {/* Outside Label */}
        {showLabel && labelPosition === 'outside' && (
          <span className="text-xs font-medium text-foreground min-w-[3ch] text-right">
            {roundedPercent}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CircularProgress - Circular progress indicator
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  const roundedPercent = Math.round(percent);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold">{roundedPercent}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * ProgressStats - Progress with additional statistics
 */
interface ProgressStatsProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressStats({
  completed,
  total,
  label = 'Concluído',
  className,
}: ProgressStatsProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {completed}/{total} <span className="text-muted-foreground">({percent}%)</span>
        </span>
      </div>
      <ProgressBar value={percent} size="sm" animated />
    </div>
  );
}
