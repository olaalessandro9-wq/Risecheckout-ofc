/**
 * SecurityStats - Estatísticas de Segurança
 * 
 * Componente puro que exibe cards de estatísticas de segurança.
 * 
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Ban, AlertTriangle, Activity, Bell } from "lucide-react";

export interface SecurityStatsData {
  criticalAlerts24h: number;
  blockedIPsActive: number;
  bruteForceAttempts: number;
  rateLimitExceeded: number;
  unacknowledgedAlerts: number;
}

interface SecurityStatsProps {
  stats: SecurityStatsData;
  isLoading: boolean;
}

export function SecurityStats({ stats, isLoading }: SecurityStatsProps) {
  const statCards = [
    {
      title: "Alertas Críticos (24h)",
      value: stats.criticalAlerts24h,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "IPs Bloqueados",
      value: stats.blockedIPsActive,
      icon: Ban,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Tentativas Brute Force",
      value: stats.bruteForceAttempts,
      icon: Shield,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Rate Limit Excedido",
      value: stats.rateLimitExceeded,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Alertas Não Reconhecidos",
      value: stats.unacknowledgedAlerts,
      icon: Bell,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
