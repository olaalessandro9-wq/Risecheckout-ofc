/**
 * ContentGate - Overlay for locked/drip content
 */

import { motion } from 'framer-motion';
import {
  Lock,
  Clock,
  Users,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type LockReason = 'drip' | 'group' | 'purchase' | 'prerequisite';

interface ContentGateProps {
  isLocked: boolean;
  reason?: LockReason;
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
  drip: {
    icon: Clock,
    title: 'Conteúdo programado',
    description: 'Este conteúdo será liberado em breve',
    color: 'text-amber-500',
  },
  group: {
    icon: Users,
    title: 'Acesso restrito',
    description: 'Você não tem acesso a este conteúdo',
    color: 'text-blue-500',
  },
  purchase: {
    icon: ShoppingCart,
    title: 'Conteúdo premium',
    description: 'Faça upgrade para acessar este conteúdo',
    color: 'text-purple-500',
  },
  prerequisite: {
    icon: Lock,
    title: 'Pré-requisito necessário',
    description: 'Complete o conteúdo anterior primeiro',
    color: 'text-orange-500',
  },
};

export function ContentGate({
  isLocked,
  reason = 'drip',
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
      {/* Blurred content behind */}
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
      >
        <div className="text-center p-6 max-w-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
              'bg-muted'
            )}
          >
            <Icon className={cn('w-8 h-8', config.color)} />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold text-lg mb-1">{config.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {reason === 'prerequisite' && prerequisiteTitle
                ? `Complete "${prerequisiteTitle}" primeiro`
                : config.description}
            </p>

            {formattedDate && reason === 'drip' && (
              <p className="text-sm text-muted-foreground mb-4">
                <Clock className="w-4 h-4 inline-block mr-1" />
                Libera em: {formattedDate}
              </p>
            )}

            {onRequestAccess && reason === 'purchase' && (
              <Button onClick={onRequestAccess} className="mt-2">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// ContentGateBadge - Small badge for list items
// ============================================================================

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
  const config = reasonConfig[reason];
  const Icon = config.icon;

  const formattedDate = unlockDate
    ? new Date(unlockDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  const label = reason === 'drip' && formattedDate
    ? formattedDate
    : reason === 'group'
      ? 'Restrito'
      : reason === 'purchase'
        ? 'Premium'
        : 'Bloqueado';

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs gap-1', className)}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
