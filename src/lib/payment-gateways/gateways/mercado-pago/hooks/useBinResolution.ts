/**
 * useBinResolution - Hook para resolver paymentMethodId e issuerId via BIN
 * 
 * Responsabilidade única: Resolução de BIN do cartão
 * Limite: < 80 linhas
 */

import { useRef, useCallback } from 'react';
import { getPaymentMethods, getIssuers } from '@mercadopago/sdk-react';
import { createLogger } from '@/lib/logger';

const log = createLogger('BinResolution');

export interface BinResolutionReturn {
  paymentMethodIdRef: React.RefObject<string>;
  issuerIdRef: React.RefObject<string>;
  handleBinChange: (bin: string) => Promise<void>;
}

export function useBinResolution(): BinResolutionReturn {
  const paymentMethodIdRef = useRef<string>('');
  const issuerIdRef = useRef<string>('');
  const lastBinRef = useRef<string>('');

  const handleBinChange = useCallback(async (bin: string) => {
    // Evitar chamadas duplicadas para o mesmo BIN
    if (!bin || bin.length < 6 || bin === lastBinRef.current) return;
    lastBinRef.current = bin;
    
    log.trace('Resolvendo paymentMethodId para BIN:', bin);
    
    try {
      // Chamar getPaymentMethods para identificar a bandeira
      const paymentMethods = await getPaymentMethods({ bin });
      log.trace('PaymentMethods response', paymentMethods);
      
      if (paymentMethods?.results && paymentMethods.results.length > 0) {
        const method = paymentMethods.results[0];
        paymentMethodIdRef.current = method.id || '';
        log.debug('PaymentMethodId resolvido', paymentMethodIdRef.current);
        
        // Tentar resolver o issuer
        if (method.issuer?.id) {
          issuerIdRef.current = method.issuer.id.toString();
          log.debug('IssuerId (do paymentMethod)', issuerIdRef.current);
        } else {
          // Chamar getIssuers se necessário
          try {
            const issuers = await getIssuers({ bin, paymentMethodId: method.id });
            log.trace('Issuers response', issuers);
            
            if (issuers && issuers.length > 0) {
              issuerIdRef.current = issuers[0].id?.toString() || '';
              log.debug('IssuerId (de getIssuers)', issuerIdRef.current);
            }
          } catch (issuerError) {
            log.trace('Issuers não disponível', issuerError);
          }
        }
      } else {
        log.warn('Nenhum paymentMethod encontrado para BIN', bin);
      }
    } catch (error: unknown) {
      log.error('Erro ao resolver paymentMethodId', error);
    }
  }, []);

  return {
    paymentMethodIdRef,
    issuerIdRef,
    handleBinChange
  };
}
