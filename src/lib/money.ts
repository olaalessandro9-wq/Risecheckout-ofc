import { createLogger } from '@/lib/logger';

const log = createLogger('Money');

/**
 * 💰 BÍBLIA DOS PREÇOS - Arquitetura "Integer First"
 * 
 * REGRA DE OURO: Todo cálculo monetário é feito em CENTAVOS (inteiros).
 * Só convertemos para REAIS na hora de exibir na tela.
 * 
 * BENEFÍCIOS:
 * - Zero erros de arredondamento (inteiros são exatos)
 * - Compatibilidade nativa com gateways (todos pedem centavos)
 * - Código óbvio: Se aparecer "R$ 1990,00", sabemos que esquecemos de formatar
 * 
 * PROIBIDO:
 * - parseFloat() solto no código
 * - Math.round(price * 100) espalhado
 * - .toFixed() para formatação manual
 */

// ============================================================================
// SEÇÃO 1: CONVERSÃO DE ENTRADA (String/Number → Centavos)
// ============================================================================

/**
 * Converte qualquer valor para CENTAVOS (inteiro).
 * 
 * @param value - Pode ser:
 *   - Number em REAIS: 19.90 → 1990
 *   - Number em CENTAVOS: 1990 → 1990 (se já for inteiro)
 *   - String formatada: "19,90" → 1990
 *   - String com R$: "R$ 19,90" → 1990
 * 
 * @returns Valor em centavos (inteiro)
 * 
 * @example
 * toCents(19.90)        // 1990
 * toCents("19,90")      // 1990
 * toCents("R$ 19,90")   // 1990
 * toCents(1990)         // 1990 (já é inteiro, assume centavos)
 */
export function toCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // Se for string, limpar e converter
  if (typeof value === 'string') {
    // Remover "R$", espaços, pontos (milhares)
    const cleaned = value
      .replace(/R\$/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '');
    
    // Substituir vírgula por ponto (decimal brasileiro → JS)
    const normalized = cleaned.replace(',', '.');
    
    const number = parseFloat(normalized);
    
    if (isNaN(number)) {
      log.warn(`toCents: Valor inválido "${value}", retornando 0`);
      return 0;
    }
    
    // Se tem decimal, está em REAIS → converter para centavos
    if (normalized.includes('.')) {
      return Math.round(number * 100);
    }
    
    // Se não tem decimal, assume que já está em centavos
    return Math.round(number);
  }

  // Se for number
  const number = Number(value);
  
  if (isNaN(number)) {
    log.warn(`toCents: Valor inválido ${value}, retornando 0`);
    return 0;
  }

  // Se for inteiro, assume que já está em centavos
  if (Number.isInteger(number)) {
    return number;
  }

  // Se tem decimal, está em REAIS → converter para centavos
  return Math.round(number * 100);
}

/**
 * Converte input brasileiro "R$ 1.234,56" para CENTAVOS.
 * Uso específico para campos de formulário.
 * 
 * @param input - String formatada em padrão brasileiro
 * @returns Valor em centavos (inteiro)
 * 
 * @example
 * parseBRLInput("R$ 1.234,56")  // 123456
 * parseBRLInput("1.234,56")     // 123456
 * parseBRLInput("1234,56")      // 123456
 */
export function parseBRLInput(input: string): number {
  if (!input || input.trim() === '') {
    return 0;
  }

  // Remover "R$", espaços
  let cleaned = input
    .replace(/R\$/g, '')
    .replace(/\s/g, '');

  // Remover pontos (separador de milhares)
  cleaned = cleaned.replace(/\./g, '');

  // Substituir vírgula por ponto (decimal)
  cleaned = cleaned.replace(',', '.');

  const number = parseFloat(cleaned);

  if (isNaN(number)) {
    log.warn(`parseBRLInput: Valor inválido "${input}", retornando 0`);
    return 0;
  }

  return Math.round(number * 100);
}

// ============================================================================
// SEÇÃO 2: CONVERSÃO DE SAÍDA (Centavos → Reais/String)
// ============================================================================

/**
 * Converte CENTAVOS para REAIS (número decimal).
 * Uso raro - prefira formatCentsToBRL() para exibição.
 * 
 * @param cents - Valor em centavos
 * @returns Valor em reais (decimal)
 * 
 * @example
 * toReais(1990)  // 19.90
 */
export function toReais(cents: number | null | undefined): number {
  if (cents === null || cents === undefined) {
    return 0;
  }
  return Number(cents) / 100;
}

/**
 * Formata CENTAVOS para string brasileira "R$ 1.234,56".
 * ESTA É A FUNÇÃO PRINCIPAL PARA EXIBIÇÃO.
 * 
 * @param cents - Valor em centavos
 * @param options - Opções de formatação
 * @returns String formatada
 * 
 * @example
 * formatCentsToBRL(1990)           // "R$ 19,90"
 * formatCentsToBRL(123456)         // "R$ 1.234,56"
 * formatCentsToBRL(1990, {symbol: false})  // "19,90"
 */
export function formatCentsToBRL(
  cents: number | null | undefined,
  options: { symbol?: boolean } = { symbol: true }
): string {
  if (cents === null || cents === undefined) {
    return options.symbol ? "R$ 0,00" : "0,00";
  }

  const value = Number(cents) / 100;
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return options.symbol ? `R$ ${formatted}` : formatted;
}

// ============================================================================
// SEÇÃO 3: OPERAÇÕES MATEMÁTICAS (Sempre em Centavos)
// ============================================================================

/**
 * Soma valores em centavos.
 * 
 * @param values - Array de valores em centavos
 * @returns Soma total em centavos
 * 
 * @example
 * sumCents([1990, 500, 1000])  // 3490 (R$ 34,90)
 */
export function sumCents(...values: (number | null | undefined)[]): number {
  return values.reduce((total, value) => {
    return total + (value || 0);
  }, 0);
}

/**
 * Aplica desconto percentual em valor em centavos.
 * 
 * @param cents - Valor original em centavos
 * @param discountPercent - Percentual de desconto (0-100)
 * @returns Valor com desconto aplicado em centavos
 * 
 * @example
 * applyDiscount(1990, 10)  // 1791 (R$ 17,91 - 10% off de R$ 19,90)
 */
export function applyDiscount(cents: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    log.warn(`applyDiscount: Percentual inválido ${discountPercent}%, usando 0%`);
    return cents;
  }
  
  const discountMultiplier = (100 - discountPercent) / 100;
  return Math.round(cents * discountMultiplier);
}

/**
 * Calcula percentual de desconto entre dois valores.
 * 
 * @param originalCents - Valor original em centavos
 * @param discountedCents - Valor com desconto em centavos
 * @returns Percentual de desconto (0-100)
 * 
 * @example
 * calculateDiscountPercent(1990, 1791)  // 10
 */
export function calculateDiscountPercent(
  originalCents: number,
  discountedCents: number
): number {
  if (originalCents <= 0) {
    return 0;
  }
  
  const discount = originalCents - discountedCents;
  return Math.round((discount / originalCents) * 100);
}

// ============================================================================
// SEÇÃO 4: VALIDAÇÃO
// ============================================================================

/**
 * Valida se um valor em centavos é válido para transação.
 * 
 * @param cents - Valor em centavos
 * @param minCents - Valor mínimo permitido (padrão: 1 centavo)
 * @returns true se válido
 * 
 * @example
 * isValidAmount(1990)   // true
 * isValidAmount(0)      // false
 * isValidAmount(-100)   // false
 */
export function isValidAmount(cents: number, minCents: number = 1): boolean {
  return Number.isInteger(cents) && cents >= minCents;
}

// ============================================================================
// SEÇÃO 5: UTILITÁRIOS PARA DEBUGGING
// ============================================================================

/**
 * Formata valor para debug (mostra centavos E reais).
 * 
 * @param cents - Valor em centavos
 * @returns String para debug
 * 
 * @example
 * debugMoney(1990)  // "1990 cents (R$ 19,90)"
 */
export function debugMoney(cents: number): string {
  return `${cents} cents (${formatCentsToBRL(cents)})`;
}
