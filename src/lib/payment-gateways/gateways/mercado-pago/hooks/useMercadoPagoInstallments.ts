/**
 * useMercadoPagoInstallments - Hook para buscar parcelas reais do Mercado Pago
 * 
 * Responsabilidade única: Buscar payer_costs reais via SDK do MP
 * Fallback: generateInstallments local quando BIN não disponível
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getInstallments } from '@mercadopago/sdk-react';
import type { Installment } from '@/types/payment-types';
import { generateInstallments, formatCurrency } from '../../../installments';

export interface UseMercadoPagoInstallmentsProps {
  amountCents: number;
  bin: string;
  paymentMethodId: string;
  maxInstallments?: number;
}

export interface UseMercadoPagoInstallmentsReturn {
  installments: Installment[];
  isLoading: boolean;
  error: string | null;
  source: 'mercadopago' | 'fallback';
}

export function useMercadoPagoInstallments({
  amountCents,
  bin,
  paymentMethodId,
  maxInstallments
}: UseMercadoPagoInstallmentsProps): UseMercadoPagoInstallmentsReturn {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'mercadopago' | 'fallback'>('fallback');
  
  const lastFetchKey = useRef<string>('');

  // Gerar parcelas locais como fallback
  const generateFallback = useCallback(() => {
    if (amountCents > 0) {
      const config = maxInstallments !== undefined ? { maxInstallments } : {};
      const fallbackInstallments = generateInstallments(amountCents, config);
      setInstallments(fallbackInstallments);
      setSource('fallback');
      console.log('[useMercadoPagoInstallments] Usando fallback local:', fallbackInstallments.length, 'parcelas');
    }
  }, [amountCents, maxInstallments]);

  // Buscar parcelas reais do MP
  const fetchRealInstallments = useCallback(async () => {
    // Precisa de BIN válido (6+ dígitos)
    if (!bin || bin.length < 6 || amountCents <= 0) {
      generateFallback();
      return;
    }

    // Evitar chamadas duplicadas para a mesma combinação
    const fetchKey = `${bin}-${amountCents}-${paymentMethodId}`;
    if (fetchKey === lastFetchKey.current) {
      return;
    }
    lastFetchKey.current = fetchKey;

    setIsLoading(true);
    setError(null);

    try {
      // Converter centavos para reais (string)
      const amountReais = (amountCents / 100).toFixed(2);
      
      console.log('[useMercadoPagoInstallments] Buscando parcelas reais:', { bin, amountReais, paymentMethodId });
      
      const response = await getInstallments({
        amount: amountReais,
        bin,
        ...(paymentMethodId && { paymentMethodId })
      });

      console.log('[useMercadoPagoInstallments] Resposta MP:', response);

      if (response && response.length > 0 && response[0].payer_costs) {
        const payerCosts = response[0].payer_costs;
        
        // Mapear payer_costs para nosso tipo Installment
        let mappedInstallments: Installment[] = payerCosts.map((cost) => ({
          value: cost.installments,
          installmentAmount: Math.round(cost.installment_amount * 100), // Converter para centavos
          totalAmount: Math.round(cost.total_amount * 100),
          hasInterest: cost.installment_rate > 0,
          label: `${cost.installments}x de ${formatCurrency(Math.round(cost.installment_amount * 100))}${cost.installment_rate > 0 ? ' (com juros)' : ' sem juros'}`
        }));

        // Aplicar filtro maxInstallments se definido
        if (maxInstallments !== undefined) {
          mappedInstallments = mappedInstallments.filter(inst => inst.value <= maxInstallments);
        }

        // Ordenar por número de parcelas
        mappedInstallments.sort((a, b) => a.value - b.value);

        if (mappedInstallments.length > 0) {
          setInstallments(mappedInstallments);
          setSource('mercadopago');
          console.log('[useMercadoPagoInstallments] ✅ Parcelas reais carregadas:', mappedInstallments.length);
        } else {
          generateFallback();
        }
      } else {
        console.log('[useMercadoPagoInstallments] Sem payer_costs, usando fallback');
        generateFallback();
      }
    } catch (err) {
      console.error('[useMercadoPagoInstallments] Erro ao buscar parcelas:', err);
      setError('Não foi possível carregar as parcelas');
      generateFallback();
    } finally {
      setIsLoading(false);
    }
  }, [bin, amountCents, paymentMethodId, maxInstallments, generateFallback]);

  // Efeito: gerar fallback inicial imediatamente
  useEffect(() => {
    if (amountCents > 0 && installments.length === 0) {
      generateFallback();
    }
  }, [amountCents, generateFallback, installments.length]);

  // Efeito: buscar parcelas reais quando BIN disponível
  useEffect(() => {
    if (bin && bin.length >= 6) {
      fetchRealInstallments();
    }
  }, [bin, fetchRealInstallments]);

  return {
    installments,
    isLoading,
    error,
    source
  };
}
