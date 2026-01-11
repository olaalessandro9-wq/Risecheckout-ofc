/**
 * AffiliatesMetrics Component
 * 
 * Cards de métricas para a página de afiliados.
 */

import { Card } from "@/components/ui/card";

interface AffiliateData {
  status: "pending" | "active" | "rejected" | "blocked" | "cancelled";
}

interface AffiliatesMetricsProps {
  affiliates: AffiliateData[];
}

export function AffiliatesMetrics({ affiliates }: AffiliatesMetricsProps) {
  const stats = [
    { 
      label: "Total", 
      value: affiliates.length, 
      color: "text-primary" 
    },
    { 
      label: "Aprovados", 
      value: affiliates.filter(a => a.status === "active").length, 
      color: "text-green-600" 
    },
    { 
      label: "Pendentes", 
      value: affiliates.filter(a => a.status === "pending").length, 
      color: "text-amber-600" 
    },
    { 
      label: "Recusados, Bloqueados e Cancelados", 
      value: affiliates.filter(a => 
        a.status === "rejected" || 
        a.status === "blocked" || 
        a.status === "cancelled"
      ).length, 
      color: "text-red-600" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="p-4 border-l-4 border-l-primary/10 hover:border-l-primary transition-colors">
          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
