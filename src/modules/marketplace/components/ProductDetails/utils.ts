/**
 * Utilitários para ProductDetails
 * 
 * Funções puras sem side effects
 */

/**
 * Formata preço em centavos para moeda brasileira
 */
export function formatPrice(price: number | null): string {
  if (!price) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price / 100);
}
