/**
 * PriceDisplay - Componente global para exibição de preços
 * 
 * SEMPRE use este componente para exibir preços em qualquer lugar do sistema!
 * 
 * Características:
 * - Recebe valores em CENTAVOS
 * - Exibe valores formatados em REAIS (R$ X,XX)
 * - Garante consistência em toda a aplicação
 * - Suporta customização de estilo
 * 
 * Exemplos:
 * ```tsx
 * <PriceDisplay cents={2990} />                    // R$ 29,90
 * <PriceDisplay cents={150} />                     // R$ 1,50
 * <PriceDisplay cents={50500} className="text-lg" /> // R$ 505,00 (grande)
 * ```
 */

import { formatBRL } from "@/lib/formatters/money";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  /**
   * Valor em CENTAVOS (integer)
   * Exemplo: 2990 = R$ 29,90
   */
  cents: number;
  
  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
  
  /**
   * Estilo inline (opcional)
   */
  style?: React.CSSProperties;
}

/**
 * Componente para exibir preços formatados em BRL
 * 
 * @param cents - Valor em centavos (ex: 2990 = R$ 29,90)
 * @param className - Classes CSS opcionais
 * @param style - Estilos inline opcionais
 * 
 * @example
 * ```tsx
 * // Exibir preço simples
 * <PriceDisplay cents={product.price} />
 * 
 * // Com estilo customizado
 * <PriceDisplay 
 *   cents={product.price} 
 *   className="text-2xl font-bold text-green-600" 
 * />
 * 
 * // Com estilo inline
 * <PriceDisplay 
 *   cents={product.price} 
 *   style={{ color: 'var(--primary)' }} 
 * />
 * ```
 */
export function PriceDisplay({ cents, className, style }: PriceDisplayProps) {
  return (
    <span className={cn(className)} style={style}>
      {formatBRL(cents)}
    </span>
  );
}

/**
 * Variante para exibir preço com desconto (riscado)
 * 
 * @example
 * ```tsx
 * <PriceDisplayWithDiscount 
 *   originalCents={2990}  // R$ 29,90 (riscado)
 *   discountCents={1990}  // R$ 19,90 (destaque)
 * />
 * ```
 */
interface PriceDisplayWithDiscountProps {
  /**
   * Preço original em CENTAVOS (será exibido riscado)
   */
  originalCents: number;
  
  /**
   * Preço com desconto em CENTAVOS (será exibido em destaque)
   */
  discountCents: number;
  
  /**
   * Classes CSS para o preço original (riscado)
   */
  originalClassName?: string;
  
  /**
   * Classes CSS para o preço com desconto
   */
  discountClassName?: string;
  
  /**
   * Layout: horizontal ou vertical
   */
  layout?: "horizontal" | "vertical";
}

export function PriceDisplayWithDiscount({
  originalCents,
  discountCents,
  originalClassName,
  discountClassName,
  layout = "horizontal"
}: PriceDisplayWithDiscountProps) {
  const containerClass = layout === "horizontal" 
    ? "flex items-center gap-2" 
    : "flex flex-col gap-1";
  
  return (
    <div className={containerClass}>
      <span className={cn("line-through text-muted-foreground", originalClassName)}>
        {formatBRL(originalCents)}
      </span>
      <span className={cn("font-bold text-primary", discountClassName)}>
        {formatBRL(discountCents)}
      </span>
    </div>
  );
}

/**
 * Variante para exibir apenas o valor numérico (sem "R$")
 * Útil para inputs ou casos específicos
 * 
 * @example
 * ```tsx
 * <PriceDisplayNumeric cents={2990} />  // 29,90
 * ```
 */
interface PriceDisplayNumericProps {
  cents: number;
  className?: string;
  style?: React.CSSProperties;
}

export function PriceDisplayNumeric({ cents, className, style }: PriceDisplayNumericProps) {
  const formatted = formatBRL(cents).replace("R$", "").trim();
  
  return (
    <span className={cn(className)} style={style}>
      {formatted}
    </span>
  );
}

/**
 * Hook para formatar preços (para uso em lógica, não em JSX)
 * 
 * @example
 * ```tsx
 * const { formatPrice } = usePriceFormatter();
 * const priceText = formatPrice(2990); // "R$ 29,90"
 * ```
 */
export function usePriceFormatter() {
  return {
    formatPrice: (cents: number) => formatBRL(cents),
    formatPriceNumeric: (cents: number) => formatBRL(cents).replace("R$", "").trim()
  };
}
