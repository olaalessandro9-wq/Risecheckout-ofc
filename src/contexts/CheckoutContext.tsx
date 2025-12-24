/**
 * Context API para o Sistema de Checkout
 * 
 * Fornece os dados do checkout (produto, design, order bumps) para todos
 * os componentes filhos, evitando "prop drilling".
 */

import React, { createContext, useContext, ReactNode } from 'react';
import type { Checkout, CheckoutDesign, OrderBump } from '@/types/checkout';

// ============================================================================
// INTERFACE DO CONTEXTO
// ============================================================================

interface CheckoutContextValue {
  checkout: Checkout | null;
  design: CheckoutDesign | null;
  orderBumps: OrderBump[];
  vendorId: string | null;
}

// ============================================================================
// CRIAÇÃO DO CONTEXTO
// ============================================================================

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CheckoutProviderProps {
  children: ReactNode;
  value: CheckoutContextValue;
}

export const CheckoutProvider: React.FC<CheckoutProviderProps> = ({ children, value }) => {
  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

// ============================================================================
// HOOK CUSTOMIZADO PARA CONSUMIR O CONTEXTO
// ============================================================================

/**
 * Hook para acessar os dados do checkout em qualquer componente filho.
 * 
 * @throws Error se usado fora do CheckoutProvider
 * 
 * @example
 * const { checkout, design } = useCheckoutContext();
 * 
 * return <div style={{ backgroundColor: design.colors.background }}>
 *   {checkout.product.name}
 * </div>;
 */
export const useCheckoutContext = (): CheckoutContextValue => {
  const context = useContext(CheckoutContext);
  
  if (context === undefined) {
    throw new Error('useCheckoutContext must be used within a CheckoutProvider');
  }
  
  return context;
};
