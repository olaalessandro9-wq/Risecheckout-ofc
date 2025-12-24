/**
 * PopularityIndicator - Indicador de Popularidade
 * 
 * Mostra o nível de popularidade de um produto baseado em views, clicks e afiliados
 */

import { Badge } from "@/components/ui/badge";

interface PopularityIndicatorProps {
  views: number;
  clicks: number;
  affiliates: number;
}

export function PopularityIndicator({ views, clicks, affiliates }: PopularityIndicatorProps) {
  // Calcular score de popularidade
  // Views: 1 ponto cada
  // Clicks: 5 pontos cada (mais valioso que view)
  // Afiliados: 10 pontos cada (mais valioso ainda)
  const score = views + clicks * 5 + affiliates * 10;

  // Determinar nível baseado no score
  let emoji = "";
  let label = "";
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

  if (score > 1000) {
    emoji = "🔥🔥🔥";
    label = "Muito Quente";
    variant = "destructive";
  } else if (score > 500) {
    emoji = "🔥🔥";
    label = "Quente";
    variant = "default";
  } else if (score > 100) {
    emoji = "🔥";
    label = "Aquecendo";
    variant = "secondary";
  } else {
    emoji = "❄️";
    label = "Novo";
    variant = "outline";
  }

  return (
    <Badge variant={variant} className="gap-1 font-medium">
      <span>{emoji}</span>
      <span>{label}</span>
      <span className="text-xs opacity-70">({score}°)</span>
    </Badge>
  );
}
