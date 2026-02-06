/**
 * Context API para o Sistema de Checkout (UNIFICADO)
 * 
 * Single Source of Truth para dados do checkout.
 * Fornece dados do checkout (produto, design, order bumps, customização)
 * para todos os componentes filhos, evitando "prop drilling".
 * 
 * Usado por: Builder, Preview e Checkout Público
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { ThemePreset } from '@/lib/checkout/themePresets';
import type { CheckoutCustomization } from '@/types/checkoutEditor';
import type { Checkout, CheckoutDesign, OrderBump } from '@/types/checkout';

// ============================================================================
// INTERFACE DO CONTEXTO (UNIFICADA)
// ============================================================================

export interface CheckoutContextValue {
  /** Dados completos do checkout (se disponível) */
  checkout: Checkout | null;
  /** Design/tema do checkout */
  design: ThemePreset | CheckoutDesign | null;
  /** Order bumps disponíveis */
  orderBumps: OrderBump[];
  /** ID do vendor (null em checkout público por segurança) */
  vendorId: string | null;
  /** Dados do produto (formato simplificado para compatibilidade) */
  productData?: {
    id?: string;
    name?: string;
    description?: string;
    price?: number;
    image_url?: string | null;
  };
  /** Customizações do checkout (topComponents, bottomComponents) */
  customization?: CheckoutCustomization;
}

// ============================================================================
// CRIAÇÃO DO CONTEXTO
// ============================================================================

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

// Interface para Provider com `value` direto (forma padrão - PublicCheckoutV2)
interface CheckoutProviderValueProps {
  children: ReactNode;
  value: CheckoutContextValue;
}

// Interface para Provider com props separadas (forma usada no CheckoutEditorMode)
interface CheckoutProviderPropsProps {
  children: ReactNode;
  design?: ThemePreset;
  customization?: CheckoutCustomization;
  productData?: CheckoutContextValue['productData'];
  orderBumps?: OrderBump[];
}

type CheckoutProviderProps = CheckoutProviderValueProps | CheckoutProviderPropsProps;

/**
 * Provider que envolve os componentes e fornece os dados do checkout.
 * Aceita tanto `value` quanto props separadas para flexibilidade.
 * 
 * @example
 * // Forma 1: Com value (PublicCheckoutV2)
 * <CheckoutProvider value={{ checkout, design, orderBumps, vendorId: null }}>
 *   {children}
 * </CheckoutProvider>
 * 
 * @example
 * // Forma 2: Com props separadas (CheckoutEditorMode)
 * <CheckoutProvider
 *   design={design}
 *   customization={customization}
 *   productData={productData}
 *   orderBumps={orderBumps}
 * >
 *   {children}
 * </CheckoutProvider>
 */
export const CheckoutProvider: React.FC<CheckoutProviderProps> = (props) => {
  // Determinar se estamos usando `value` ou props separadas
  const contextValue = useMemo<CheckoutContextValue>(() => {
    if ('value' in props) {
      return props.value;
    }
    // Construir value a partir de props separadas
    return {
      checkout: null,
      design: props.design || null,
      orderBumps: props.orderBumps || [],
      vendorId: null,
      productData: props.productData,
      customization: props.customization,
    };
  }, [
    'value' in props ? props.value : null,
    'value' in props ? null : props.orderBumps,
    'value' in props ? null : props.productData,
    'value' in props ? null : props.design,
    'value' in props ? null : props.customization,
  ]);

  return (
    <CheckoutContext.Provider value={contextValue}>
      {props.children}
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
 * const { checkout, design, orderBumps, productData } = useCheckoutContext();
 * 
 * return <div style={{ backgroundColor: design?.colors?.background }}>
 *   {productData?.name || checkout?.product?.name}
 * </div>;
 */
export const useCheckoutContext = (): CheckoutContextValue => {
  const context = useContext(CheckoutContext);
  
  if (context === undefined) {
    throw new Error('useCheckoutContext must be used within a CheckoutProvider');
  }
  
  return context;
};

// Aliases removidos em 2026-01-11 (RISE Protocol cleanup)
// useCheckoutData → use useCheckoutContext
// CheckoutDataProvider → use CheckoutProvider
