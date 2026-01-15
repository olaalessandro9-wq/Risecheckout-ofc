/**
 * useGatewayManager - Hook para gerenciar múltiplos gateways
 * 
 * Hook gateway-agnostic que abstrai a lógica de inicialização e
 * gerenciamento de diferentes gateways de pagamento.
 * 
 * Responsabilidades:
 * - Carregar SDK do gateway apropriado
 * - Gerenciar estado de inicialização
 * - Fornecer interface unificada para todos os gateways
 * 
 * Gateways Suportados:
 * - Mercado Pago ✅
 * - Stripe (planejado)
 * - PagSeguro (planejado)
 */

import { useState, useEffect, useCallback } from 'react';
import type { PaymentGatewayId as PaymentGatewayType } from '@/types/payment-types';

// ============================================
// INTERFACES
// ============================================

export interface GatewayConfig {
  gateway: PaymentGatewayType;
  publicKey: string;
  amount: number;
  payerEmail: string;
}

export interface UseGatewayManagerProps {
  config: GatewayConfig | null;
  enabled?: boolean;
}

export interface UseGatewayManagerReturn {
  /** Gateway está pronto para uso */
  isReady: boolean;
  
  /** Gateway está carregando */
  isLoading: boolean;
  
  /** Erro ao carregar gateway */
  error: string | null;
  
  /** Gateway atual */
  gateway: PaymentGatewayType | null;
  
  /** Recarrega o gateway */
  reload: () => void;
}

// ============================================
// SDK LOADERS
// ============================================

/**
 * Carrega SDK do Mercado Pago
 */
async function loadMercadoPagoSDK(publicKey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Verifica se já está carregado
    if (window.MercadoPago) {
      console.log('[GatewayManager] Mercado Pago SDK já carregado');
      resolve(true);
      return;
    }

    // Carrega script
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      if (window.MercadoPago) {
        try {
          // Inicializa SDK
          new window.MercadoPago(publicKey, { locale: 'pt-BR' });
          console.log('[GatewayManager] ✅ Mercado Pago SDK carregado e inicializado');
          resolve(true);
        } catch (error: unknown) {
          console.error('[GatewayManager] Erro ao inicializar Mercado Pago:', error);
          reject(new Error('Erro ao inicializar Mercado Pago'));
        }
      } else {
        reject(new Error('SDK do Mercado Pago não encontrado'));
      }
    };
    
    script.onerror = () => {
      console.error('[GatewayManager] Erro ao carregar SDK do Mercado Pago');
      reject(new Error('Erro ao carregar SDK do Mercado Pago'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Carrega SDK do Stripe
 * TODO: Implementar quando adicionar Stripe
 */
async function loadStripeSDK(publicKey: string): Promise<boolean> {
  console.warn('[GatewayManager] Stripe ainda não implementado');
  return Promise.reject(new Error('Stripe ainda não implementado'));
}

/**
 * Carrega SDK do PagSeguro
 * TODO: Implementar quando adicionar PagSeguro
 */
async function loadPagSeguroSDK(publicKey: string): Promise<boolean> {
  console.warn('[GatewayManager] PagSeguro ainda não implementado');
  return Promise.reject(new Error('PagSeguro ainda não implementado'));
}

// ============================================
// GATEWAY LOADER REGISTRY
// ============================================

const GATEWAY_LOADERS: Record<string, (publicKey: string) => Promise<boolean>> = {
  mercadopago: loadMercadoPagoSDK,
  pushinpay: () => Promise.resolve(true), // PIX não precisa de SDK frontend
  stripe: loadStripeSDK,
  pagseguro: loadPagSeguroSDK,
  cielo: () => Promise.reject(new Error('Cielo ainda não implementado')),
  rede: () => Promise.reject(new Error('Rede ainda não implementado')),
  getnet: () => Promise.reject(new Error('Getnet ainda não implementado')),
  adyen: () => Promise.reject(new Error('Adyen ainda não implementado')),
  paypal: () => Promise.reject(new Error('PayPal ainda não implementado')),
};

// ============================================
// HOOK
// ============================================

export function useGatewayManager({
  config,
  enabled = true,
}: UseGatewayManagerProps): UseGatewayManagerReturn {
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const loadGateway = useCallback(async () => {
    if (!config || !enabled) {
      setIsReady(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const { gateway, publicKey } = config;

    if (!publicKey) {
      setError('Chave pública não fornecida');
      setIsReady(false);
      setIsLoading(false);
      return;
    }

    console.log(`[GatewayManager] Carregando gateway: ${gateway}`);
    setIsLoading(true);
    setError(null);

    try {
      const loader = GATEWAY_LOADERS[gateway];
      
      if (!loader) {
        throw new Error(`Gateway ${gateway} não suportado`);
      }

      await loader(publicKey);
      
      setIsReady(true);
      setError(null);
      console.log(`[GatewayManager] ✅ Gateway ${gateway} pronto`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar gateway';
      console.error(`[GatewayManager] ❌ Erro ao carregar ${gateway}:`, err);
      setError(errorMessage);
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [config, enabled, loadAttempt]);

  useEffect(() => {
    loadGateway();
  }, [loadGateway]);

  const reload = useCallback(() => {
    setLoadAttempt(prev => prev + 1);
  }, []);

  return {
    isReady,
    isLoading,
    error,
    gateway: config?.gateway || null,
    reload,
  };
}
