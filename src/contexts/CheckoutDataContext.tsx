import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { ThemePreset } from '@/lib/checkout/themePresets';
import type { CheckoutCustomization } from '@/hooks/useCheckoutEditor';

/**
 * Interface para os dados compartilhados do checkout
 */
export interface CheckoutData {
  orderBumps: any[];
  productData?: any;
  design?: ThemePreset;
  customization?: CheckoutCustomization;
}

/**
 * Context para compartilhar dados do checkout entre componentes
 * Evita prop drilling e facilita acesso aos dados em componentes profundos
 */
const CheckoutDataContext = createContext<CheckoutData | undefined>(undefined);

// Interface para o Provider com `value` (forma padrão)
interface CheckoutDataProviderValueProps {
  children: ReactNode;
  value: CheckoutData;
}

// Interface para o Provider com props separadas (forma usada no CheckoutEditorMode)
interface CheckoutDataProviderPropsProps {
  children: ReactNode;
  design?: ThemePreset;
  customization?: CheckoutCustomization;
  productData?: any;
  orderBumps?: any[];
}

type CheckoutDataProviderProps = CheckoutDataProviderValueProps | CheckoutDataProviderPropsProps;

/**
 * Provider que envolve os componentes e fornece os dados do checkout
 * Aceita tanto `value` quanto props separadas para flexibilidade
 */
export const CheckoutDataProvider = (props: CheckoutDataProviderProps) => {
  // Determinar se estamos usando `value` ou props separadas
  const contextValue = useMemo<CheckoutData>(() => {
    if ('value' in props) {
      return props.value;
    }
    return {
      orderBumps: props.orderBumps || [],
      productData: props.productData,
      design: props.design,
      customization: props.customization,
    };
  }, ['value' in props ? props.value : null, 
      'value' in props ? null : props.orderBumps,
      'value' in props ? null : props.productData,
      'value' in props ? null : props.design,
      'value' in props ? null : props.customization]);

  return (
    <CheckoutDataContext.Provider value={contextValue}>
      {props.children}
    </CheckoutDataContext.Provider>
  );
};

/**
 * Hook para acessar os dados do checkout em qualquer componente filho
 * @throws Error se usado fora do CheckoutDataProvider
 */
export const useCheckoutData = (): CheckoutData => {
  const context = useContext(CheckoutDataContext);
  if (context === undefined) {
    throw new Error('useCheckoutData must be used within a CheckoutDataProvider');
  }
  return context;
};
