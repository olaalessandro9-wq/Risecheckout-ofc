import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RevenueCardProps {
  current: number;
  goal: number;
}

export function RevenueCard({ current, goal }: RevenueCardProps) {
  const percentage = Math.round((current / goal) * 100);
  
  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Faturamento</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              R$ {current.toLocaleString('pt-BR')}
            </span>
            <span className="text-sm text-muted-foreground">
              / R$ {goal.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">{percentage}%</span>
        </div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  );
}
