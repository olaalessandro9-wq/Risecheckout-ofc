/**
 * OwnerGatewayCard - Card de gateway para o Owner
 * 
 * RISE Protocol V3 Compliant
 * Mostra status "Integrado via Secrets" e "Produção" (gateways ativos)
 * Ou "Em Breve" para gateways com status 'coming_soon'
 */

import { LucideIcon, Check, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GatewayStatus } from "@/config/gateways/types";

interface OwnerGatewayCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  status?: GatewayStatus;
  /** Callback para reconexão OAuth (renderiza botão quando presente) */
  onConnect?: () => void;
  /** Estado de loading durante OAuth */
  connecting?: boolean;
}

export function OwnerGatewayCard({
  name,
  description,
  icon: Icon,
  iconColor = "#6366f1",
  status = "active",
  onConnect,
  connecting = false,
}: OwnerGatewayCardProps) {
  const isComingSoon = status === "coming_soon";

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card w-full",
        isComingSoon && "opacity-60"
      )}
    >
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

      {/* Badges e ações condicionais */}
      {isComingSoon ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Em Breve
          </span>
        </div>
      ) : (
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Badge Integrado */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Integrado via Secrets
            </span>
          </div>

          {/* Badge Produção */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Produção
            </span>
          </div>

          {/* Botão Reconectar (somente quando onConnect presente) */}
          {onConnect && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              disabled={connecting}
              className="ml-1"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", connecting && "animate-spin")} />
              {connecting ? "Conectando..." : "Reconectar"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
