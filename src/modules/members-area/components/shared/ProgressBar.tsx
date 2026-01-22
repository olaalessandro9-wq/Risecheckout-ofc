/**
 * Progress Components - Linear bar, circular, and stats display
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// ProgressBar
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'striped';
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside';
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
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-primary',
    gradient: 'bg-gradient-to-r from-primary via-primary/80 to-primary',
    striped: 'bg-primary bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && labelPosition === 'outside' && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full transition-all',
            variantClasses[variant]
          )}
        >
          {showLabel && labelPosition === 'inside' && size === 'lg' && (
            <span className="flex items-center justify-center h-full text-[10px] font-medium text-primary-foreground">
              {Math.round(percent)}%
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// CircularProgress
// ============================================================================

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
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
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
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-primary"
        />
      </svg>
      
      {showLabel && (
        <span className="absolute text-xs font-medium">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  );
}

// ============================================================================
// ProgressStats
// ============================================================================

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
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {completed} / {total} ({percent}%)
        </span>
      </div>
      <ProgressBar value={completed} max={total} size="sm" />
    </div>
  );
}
