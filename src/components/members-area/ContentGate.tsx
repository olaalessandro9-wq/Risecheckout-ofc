/**
 * ContentGate - Overlay for locked/drip content
 */

import { motion } from 'framer-motion';
import { Lock, Clock, CheckCircle, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LockReason = 'drip_locked' | 'group_locked' | 'not_purchased' | 'available';

interface ContentGateProps {
  isLocked: boolean;
  reason: LockReason;
  unlockDate?: string | null;
  prerequisiteTitle?: string;
  onRequestAccess?: () => void;
  children: React.ReactNode;
  className?: string;
}

const reasonConfig: Record<LockReason, {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}> = {
  drip_locked: {
    icon: Clock,
    title: 'Conteúdo bloqueado',
    description: 'Este conteúdo será liberado automaticamente.',
    color: 'text-amber-500',
  },
  group_locked: {
    icon: Users,
    title: 'Acesso restrito',
    description: 'Você não tem permissão para acessar este conteúdo.',
    color: 'text-orange-500',
  },
  not_purchased: {
    icon: Lock,
    title: 'Conteúdo exclusivo',
    description: 'Adquira o curso para ter acesso a este conteúdo.',
    color: 'text-red-500',
  },
  available: {
    icon: CheckCircle,
    title: 'Disponível',
    description: 'Este conteúdo está disponível para você.',
    color: 'text-green-500',
  },
};

export function ContentGate({
  isLocked,
  reason,
  unlockDate,
  prerequisiteTitle,
  onRequestAccess,
  children,
  className,
}: ContentGateProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  const config = reasonConfig[reason];
  const Icon = config.icon;

  const formattedDate = unlockDate
    ? new Date(unlockDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={cn('relative', className)}>
      {/* Blurred Content Preview */}
      <div className="relative overflow-hidden rounded-lg">
        <div className="blur-sm pointer-events-none select-none opacity-30">
          {children}
        </div>

        {/* Lock Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="text-center max-w-sm px-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                'bg-muted'
              )}
            >
              <Icon className={cn('w-8 h-8', config.color)} />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-foreground mb-2"
            >
              {config.title}
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mb-4"
            >
              {config.description}
            </motion.p>

            {/* Unlock Date */}
            {reason === 'drip_locked' && formattedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-2 text-sm mb-4 p-3 rounded-lg bg-muted"
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span>Liberação: <strong>{formattedDate}</strong></span>
              </motion.div>
            )}

            {/* Prerequisite */}
            {reason === 'drip_locked' && prerequisiteTitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm mb-4 p-3 rounded-lg bg-muted"
              >
                <p className="text-muted-foreground">
                  Complete primeiro: <strong className="text-foreground">{prerequisiteTitle}</strong>
                </p>
              </motion.div>
            )}

            {/* Action Button */}
            {reason === 'not_purchased' && onRequestAccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button onClick={onRequestAccess}>
                  Adquirir acesso
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * ContentGateBadge - Small badge to show lock status
 */
interface ContentGateBadgeProps {
  reason: LockReason;
  unlockDate?: string | null;
  className?: string;
}

export function ContentGateBadge({
  reason,
  unlockDate,
  className,
}: ContentGateBadgeProps) {
  if (reason === 'available') return null;

  const config = reasonConfig[reason];
  const Icon = config.icon;

  const formattedDate = unlockDate
    ? new Date(unlockDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        'bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className={cn('w-3 h-3', config.color)} />
      {reason === 'drip_locked' && formattedDate ? (
        <span>Libera {formattedDate}</span>
      ) : reason === 'group_locked' ? (
        <span>Acesso restrito</span>
      ) : (
        <span>Bloqueado</span>
      )}
    </div>
  );
}
