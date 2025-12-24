/**
 * 💰 Formatador de moeda BRL
 * 
 * PADRÃO: Recebe CENTAVOS, retorna string formatada em REAIS
 * 
 * @param cents - Valor em centavos (ex: 150 = R$ 1,50)
 * @returns String formatada (ex: "R$ 1,50")
 * 
 * @example
 * formatBRL(150) // "R$ 1,50"
 * formatBRL(2990) // "R$ 29,90"
 * formatBRL(0) // "R$ 0,00"
 * formatBRL(null) // "R$ 0,00"
 */
export function formatBRL(cents?: number | null): string {
  const validCents = Number.isFinite(cents as number) ? Number(cents) : 0;
  const reais = validCents / 100;
  return new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(reais);
}

/**
 * Alias para compatibilidade com código existente
 * @deprecated Use formatBRL() diretamente
 */
export function formatCentsToBRL(cents?: number | null): string {
  return formatBRL(cents);
}
