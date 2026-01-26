/**
 * PaymentCard - Card de gateway para Vendors
 * 
 * RISE Protocol V3 Compliant
 * Mostra status de conexão ou "Em Breve" para gateways coming_soon
 */

import { LucideIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GatewayStatus } from "@/config/gateways/types";

interface PaymentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  connected?: boolean;
  status?: GatewayStatus;
  onClick: () => void;
}

export function PaymentCard({ 
  name, 
  description, 
  icon: Icon, 
  iconColor = "#6366f1",
  connected = false,
  status = "active",
  onClick 
}: PaymentCardProps) {
  const isComingSoon = status === "coming_soon";

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={cn(
        "group relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-accent/50 transition-all duration-200 hover:scale-[1.01] w-full",
        isComingSoon && "opacity-60 cursor-not-allowed hover:scale-100 hover:bg-card hover:border-border"
      )}
    >
      {/* Ícone compacto */}
      <div 
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-200",
          !isComingSoon && "group-hover:scale-105"
        )}
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon className="h-6 w-6" style={{ color: iconColor }} strokeWidth={2} />
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 text-left">
        <h3 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
          {name}
        </h3>
        <p className="text-xs" style={{ color: 'var(--subtext)' }}>
          {description}
        </p>
      </div>

      {/* Status Badge */}
      {isComingSoon ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Em Breve</span>
        </div>
      ) : connected ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Conectado</span>
        </div>
      ) : (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          <span className="text-xs font-medium text-muted-foreground">Não Conectado</span>
        </div>
      )}
      
      {/* Seta indicadora - esconde quando coming_soon */}
      {!isComingSoon && (
        <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
