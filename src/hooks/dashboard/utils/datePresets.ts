/**
 * Presets de intervalo de data para o Dashboard
 */

import { subDays } from "date-fns";
import { toUTCStartOfDay, toUTCEndOfDay } from "@/lib/date-utils";
import type { DateRangePreset } from "../types";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Retorna o intervalo de datas baseado no preset selecionado
 * 
 * IMPORTANTE: As datas retornadas são objetos Date que representam
 * o início/fim do dia na timezone local do usuário. A conversão
 * para UTC é feita nas funções de API usando toUTCStartOfDay/toUTCEndOfDay.
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  
  // Criar data de início do dia hoje (meia-noite local)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  switch (preset) {
    case "today":
      return { startDate: todayStart, endDate: todayEnd };
    
    case "yesterday": {
      const yesterday = subDays(todayStart, 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: yesterdayEnd };
    }
    
    case "7days": {
      const start = subDays(todayStart, 6); // 7 dias incluindo hoje
      return { startDate: start, endDate: todayEnd };
    }
    
    case "30days": {
      const start = subDays(todayStart, 29); // 30 dias incluindo hoje
      return { startDate: start, endDate: todayEnd };
    }
    
    case "max":
      return { startDate: new Date("2020-01-01T00:00:00.000Z"), endDate: todayEnd };
    
    default:
      return { startDate: todayStart, endDate: todayEnd };
  }
}
