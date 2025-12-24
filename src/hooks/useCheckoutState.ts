/**
 * Hook: useCheckoutState
 * 
 * Responsabilidade Única: Gerenciar o estado do checkout (pagamento selecionado,
 * order bumps ativos, e cálculo do preço total).
 * 
 * Este hook centraliza toda a lógica de estado relacionada ao checkout,
 * evitando prop drilling e facilitando a manutenção.
 * 
 * @version 1.0
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = 'pix' | 'credit_card';

export interface OrderBump {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  original_price?: number;
  call_to_action?: string;
}

export interface ProductData {
  id?: string;
  name?: string;
  price?: number;
  image_url?: string;
  description?: string;
  required_fields?: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    cpf?: boolean;
    document?: boolean;
  };
}

export interface CheckoutStateReturn {
  /** Método de pagamento selecionado */
  selectedPayment: PaymentMethod;
  
  /** Função para mudar o método de pagamento */
  setSelectedPayment: (payment: PaymentMethod) => void;
  
  /** Set de IDs dos order bumps selecionados */
  selectedBumps: Set<string>;
  
  /** Função para alternar um order bump (adicionar/remover) */
  toggleBump: (bumpId: string) => void;
  
  /** Preço do produto */
  productPrice: number;
  
  /** Preço total dos bumps selecionados */
  bumpsTotal: number;
  
  /** Preço total (produto + bumps) */
  totalPrice: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para gerenciar o estado do checkout.
 * 
 * Centraliza a lógica de:
 * - Seleção de método de pagamento
 * - Seleção de order bumps
 * - Cálculo de preços
 * 
 * @param productData - Dados do produto
 * @param orderBumps - Lista de order bumps disponíveis
 * @param initialPayment - Método de pagamento inicial (padrão: 'pix')
 * 
 * @returns Estado e funções para gerenciar o checkout
 * 
 * @example
 * const checkout = useCheckoutState(productData, orderBumps);
 * 
 * // Mudar pagamento
 * checkout.setSelectedPayment('credit_card');
 * 
 * // Adicionar/remover bump
 * checkout.toggleBump('bump-123');
 * 
 * // Usar preço total
 * console.log(checkout.totalPrice); // 99.90
 */
export const useCheckoutState = (
  productData?: ProductData,
  orderBumps: OrderBump[] = [],
  initialPayment: PaymentMethod = 'pix'
): CheckoutStateReturn => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(initialPayment);
  const [selectedBumps, setSelectedBumps] = useState<Set<string>>(new Set());

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Preço do produto
  const productPrice = useMemo(() => 
    productData?.price ? Number(productData.price) : 0,
    [productData?.price]
  );

  // Preço total dos bumps selecionados
  const bumpsTotal = useMemo(() => 
    Array.from(selectedBumps).reduce((total, bumpId) => {
      const bump = orderBumps.find(b => b.id === bumpId);
      return total + (bump ? Number(bump.price) : 0);
    }, 0),
    [selectedBumps, orderBumps]
  );

  // Preço total (produto + bumps)
  const totalPrice = useMemo(() => 
    productPrice + bumpsTotal,
    [productPrice, bumpsTotal]
  );

  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  /**
   * Alterna um order bump (adiciona se não estiver selecionado, remove se estiver).
   * 
   * @param bumpId - ID do order bump
   */
  const toggleBump = useCallback((bumpId: string) => {
    setSelectedBumps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bumpId)) {
        newSet.delete(bumpId);
      } else {
        newSet.add(bumpId);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    selectedPayment,
    setSelectedPayment,
    selectedBumps,
    toggleBump,
    productPrice,
    bumpsTotal,
    totalPrice,
  };
};

// Tipos já exportados acima na seção TYPES
