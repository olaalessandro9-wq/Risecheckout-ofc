/**
 * Configuração de Presets de Data
 * 
 * @module dashboard/config
 * @version RISE V3 Compliant
 * 
 * Configuração declarativa dos presets de data disponíveis.
 */

import type { DatePresetConfig } from "../types/dashboard.types";

/**
 * Presets de data disponíveis no dropdown
 */
export const DATE_PRESETS: readonly DatePresetConfig[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "max", label: "Máximo" },
] as const;

/**
 * Retorna o label do preset selecionado
 */
export function getPresetLabel(preset: string): string {
  const config = DATE_PRESETS.find(p => p.value === preset);
  return config?.label ?? "Selecione o período";
}
