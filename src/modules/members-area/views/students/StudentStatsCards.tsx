/**
 * StudentStatsCards - Cards de estatísticas de alunos
 */

import { Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StudentStats } from '@/modules/members-area/types';

interface StudentStatsCardsProps {
  stats: StudentStats;
  isLoading?: boolean;
}

export function StudentStatsCards({ stats, isLoading = false }: StudentStatsCardsProps) {
  const cards = [
    {
      label: 'Número de alunos',
      value: stats.totalStudents,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Progresso',
      value: stats.averageProgress,
      icon: TrendingUp,
      format: (v: number) => `${Math.round(v)}%`,
    },
    {
      label: 'Conclusão',
      value: stats.completionRate,
      icon: Award,
      format: (v: number) => `${Math.round(v)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? '—' : card.format(card.value)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
