/**
 * OwnerGatewayCard - Card de gateway para o Owner
 * Mostra status "Integrado via Secrets" e "Produção" (fixos, sem toggle)
 */

import { LucideIcon, Check } from "lucide-react";

interface OwnerGatewayCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function OwnerGatewayCard({
  name,
  description,
  icon: Icon,
  iconColor = "#6366f1",
}: OwnerGatewayCardProps) {
  return (
    <div className="relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card w-full">
      {/* Ícone */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="h-6 w-6" style={{ color: iconColor }} strokeWidth={2} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1">
        <h3 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
          {name}
        </h3>
        <p className="text-xs" style={{ color: 'var(--subtext)' }}>
          {description}
        </p>
      </div>

      {/* Badge Integrado */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
        <Check className="w-3 h-3 text-green-500" />
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          Integrado via Secrets
        </span>
      </div>

      {/* Badge Produção (fixo) */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
        <Check className="w-3 h-3 text-green-500" />
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          Produção
        </span>
      </div>
    </div>
  );
}
