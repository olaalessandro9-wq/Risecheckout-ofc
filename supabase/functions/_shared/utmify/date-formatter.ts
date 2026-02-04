/**
 * ============================================================================
 * UTMify Date Formatter
 * ============================================================================
 * 
 * @module _shared/utmify/date-formatter
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Formatação de datas para o padrão esperado pela API UTMify.
 * ============================================================================
 */

/**
 * Formata data para UTMify (YYYY-MM-DD HH:mm:ss UTC)
 * 
 * Conforme documentação da API UTMify, as datas devem estar
 * no formato UTC sem timezone.
 * 
 * @param date - Data como Date object ou string ISO
 * @returns String formatada "YYYY-MM-DD HH:mm:ss"
 */
export function formatDateUTC(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Se a data for inválida, retorna a string original ou timestamp atual
  if (isNaN(d.getTime())) {
    return typeof date === "string" ? date : new Date().toISOString();
  }
  
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
