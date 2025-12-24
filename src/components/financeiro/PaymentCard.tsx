import { LucideIcon } from "lucide-react";

interface PaymentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  connected?: boolean;
  onClick: () => void;
}

export function PaymentCard({ 
  name, 
  description, 
  icon: Icon, 
  iconColor = "#6366f1",
  connected = false,
  onClick 
}: PaymentCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-accent/50 transition-all duration-200 hover:scale-[1.01] w-full"
    >
      {/* Ícone compacto */}
      <div 
        className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-transform duration-200 group-hover:scale-105"
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
      {connected ? (
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
      
      {/* Seta indicadora */}
      <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
