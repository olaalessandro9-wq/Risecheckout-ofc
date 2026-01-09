/**
 * Utilitários de data com conversão UTC explícita
 * 
 * PROBLEMA RESOLVIDO:
 * O uso de startOfDay(date).toISOString() converte a data local para UTC,
 * causando perda de ~3 horas de dados no início do período (timezone BR: UTC-3).
 * 
 * SOLUÇÃO:
 * Estas funções garantem que a data seja convertida diretamente para UTC
 * preservando o dia/mês/ano da data local do usuário.
 */

/**
 * Converte uma data local para início do dia em UTC
 * 
 * Exemplo:
 * - Input: 2026-01-02 (qualquer timezone local)
 * - Output: "2026-01-02T00:00:00.000Z"
 * 
 * Isso garante que ao filtrar por "02 de janeiro", 
 * pegamos TODOS os registros desse dia no banco.
 */
export function toUTCStartOfDay(date: Date): string {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  )).toISOString();
}

/**
 * Converte uma data local para fim do dia em UTC
 * 
 * Exemplo:
 * - Input: 2026-01-02 (qualquer timezone local)
 * - Output: "2026-01-02T23:59:59.999Z"
 * 
 * Isso garante que ao filtrar por "02 de janeiro",
 * pegamos registros ATÉ o último milissegundo desse dia.
 */
export function toUTCEndOfDay(date: Date): string {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23, 59, 59, 999
  )).toISOString();
}

/**
 * Retorna a data atual como início do dia em UTC
 */
export function todayUTCStart(): string {
  return toUTCStartOfDay(new Date());
}

/**
 * Retorna a data atual como fim do dia em UTC
 */
export function todayUTCEnd(): string {
  return toUTCEndOfDay(new Date());
}
