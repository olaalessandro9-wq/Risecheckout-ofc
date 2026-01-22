/**
 * UTMify Utility Functions
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 1.0.0 - RISE Protocol V3 - Modularizado
 * 
 * Funções utilitárias para parsing de UTM, formatação de datas e conversões.
 */

import { createLogger } from "@/lib/logger";
import { UTMParameters } from "./types";

const log = createLogger("UTMify");

/**
 * Extrai parâmetros UTM da URL
 * 
 * @param url - URL para extrair parâmetros (padrão: location.href)
 * @returns Objeto com todos os parâmetros UTM
 * 
 * @example
 * const params = extractUTMParameters();
 * // params.utm_source === "google"
 */
export function extractUTMParameters(url?: string): UTMParameters {
  if (!url) {
    url = typeof window !== "undefined" ? window.location.href : "";
  }

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      src: params.get("src"),
      sck: params.get("sck"),
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
      utm_medium: params.get("utm_medium"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
    };
  } catch (error: unknown) {
    log.warn("Erro ao extrair parâmetros UTM:", error);
    return {
      src: null,
      sck: null,
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null,
    };
  }
}

/**
 * Formata data para o formato UTC esperado pela UTMify
 * Formato: YYYY-MM-DD HH:MM:SS
 * 
 * @param date - Data como Date ou string
 * @returns String formatada no padrão UTC
 * 
 * @example
 * const formatted = formatDateForUTMify(new Date());
 * // "2025-11-29 14:30:45"
 */
export function formatDateForUTMify(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converte valor em reais para centavos
 * 
 * @param value - Valor em reais
 * @returns Valor em centavos (arredondado)
 * 
 * @example
 * const cents = convertToCents(41.87);
 * // 4187
 */
export function convertToCents(value: number): number {
  return Math.round(value * 100);
}

/**
 * Converte valor em centavos para reais
 * 
 * @param cents - Valor em centavos
 * @returns Valor em reais
 * 
 * @example
 * const reais = convertToReais(4187);
 * // 41.87
 */
export function convertToReais(cents: number): number {
  return Math.round(cents / 100 * 100) / 100;
}
