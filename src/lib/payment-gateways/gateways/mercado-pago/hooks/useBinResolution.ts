/**
 * useBinResolution - Hook para resolver paymentMethodId e issuerId via BIN
 * 
 * Responsabilidade única: Resolver paymentMethodId/issuerId para o submit do token
 * NÃO é usado para parcelas (parcelas são 100% locais)
 */

import { useRef, useCallback } from 'react';
import { getPaymentMethods, getIssuers } from '@mercadopago/sdk-react';

export interface BinResolutionReturn {
  paymentMethodIdRef: React.RefObject<string>;
  issuerIdRef: React.RefObject<string>;
  handleBinChange: (bin: string) => Promise<void>;
}

export function useBinResolution(): BinResolutionReturn {
  const paymentMethodIdRef = useRef<string>('');
  const issuerIdRef = useRef<string>('');
  const lastBinRef = useRef<string>('');

  const handleBinChange = useCallback(async (newBin: string) => {
    // Evitar chamadas duplicadas para o mesmo BIN
    if (!newBin || newBin.length < 6 || newBin === lastBinRef.current) return;
    lastBinRef.current = newBin;
    
    try {
      // Chamar getPaymentMethods para identificar a bandeira
      const paymentMethods = await getPaymentMethods({ bin: newBin });
      
      if (paymentMethods?.results && paymentMethods.results.length > 0) {
        const method = paymentMethods.results[0];
        paymentMethodIdRef.current = method.id || '';
        
        // Tentar resolver o issuer
        if (method.issuer?.id) {
          issuerIdRef.current = method.issuer.id.toString();
        } else {
          // Chamar getIssuers se necessário
          try {
            const issuers = await getIssuers({ bin: newBin, paymentMethodId: method.id });
            
            if (issuers && issuers.length > 0) {
              issuerIdRef.current = issuers[0].id?.toString() || '';
            }
          } catch {
            // Ignorar erro de issuers - não é crítico
          }
        }
      }
    } catch (error) {
      console.error('[useBinResolution] Erro ao resolver paymentMethodId:', error);
    }
  }, []);

  return {
    paymentMethodIdRef,
    issuerIdRef,
    handleBinChange
  };
}
