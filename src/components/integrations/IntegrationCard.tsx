import { LucideIcon } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
}

export function IntegrationCard({ name, icon: Icon, iconColor = "#6366f1", onClick }: IntegrationCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent hover:border-border/80 transition-all duration-200 hover:scale-[1.01]"
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
        <h3 className="text-base font-semibold text-card-foreground mb-0.5">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground">
          Clique para configurar
        </p>
      </div>
      
      {/* Seta indicadora */}
      <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
