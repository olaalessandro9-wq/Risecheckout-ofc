/**
 * Hooks para o Mercado Pago Gateway
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Este arquivo contém hooks React para carregar e gerenciar
 * a configuração do Mercado Pago do banco de dados.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MercadoPagoConfig, MercadoPagoIntegration } from "./types";
import { initializeMercadoPago } from "./api";

/**
 * Hook para carregar a configuração do Mercado Pago de um vendedor
 * 
 * Busca no banco de dados (vendor_integrations) a configuração do Mercado Pago
 * específica para o vendedor. Inclui cache de 5 minutos.
 * 
 * @param vendorId - ID do vendedor (opcional)
 * @returns Query result com os dados da integração
 * 
 * @example
 * const { data: mpIntegration, isLoading, error } = useMercadoPagoConfig(vendorId);
 * 
 * if (isLoading) return <div>Carregando...</div>;
 * if (error) return <div>Erro ao carregar config</div>;
 * if (!mpIntegration) return null;
 * 
 * return <div>Mercado Pago ativado</div>;
 */
export function useMercadoPagoConfig(vendorId?: string) {
  return useQuery({
    queryKey: ["mercadopago-config", vendorId],
    queryFn: async (): Promise<MercadoPagoIntegration | null> => {
      // Validação: se não tem vendorId, retorna null
      if (!vendorId) {
        console.warn("[MercadoPago] vendorId não fornecido para useMercadoPagoConfig");
        return null;
      }

      try {
        // Query ao banco de dados
        const { data, error } = await supabase
          .from("vendor_integrations")
          .select("*")
          .eq("vendor_id", vendorId)
          .eq("integration_type", "MERCADOPAGO")
          .eq("active", true)
          .maybeSingle();

        // Tratamento de erro
        if (error) {
          // PGRST116 = nenhuma linha encontrada (não é erro crítico)
          if (error.code === "PGRST116") {
            console.log("[MercadoPago] Integração não encontrada para vendor:", vendorId);
            return null;
          }
          console.error("[MercadoPago] Erro ao carregar configuração:", error);
          return null;
        }

        // Validação: dados vazios ou integração inativa
        if (!data || !data.active) {
          console.log("[MercadoPago] Integração não encontrada ou desativada para vendor:", vendorId);
          return null;
        }

        console.log("[MercadoPago] Configuração carregada com sucesso para vendor:", vendorId);

        return data as unknown as MercadoPagoIntegration;
      } catch (error) {
        console.error("[MercadoPago] Erro inesperado ao carregar config:", error);
        return null;
      }
    },
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Hook para inicializar o Mercado Pago no frontend
 * 
 * Carrega o script do Mercado Pago e inicializa a SDK.
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @returns true se inicializado com sucesso
 * 
 * @example
 * const isInitialized = useMercadoPagoInit(publicKey);
 * 
 * if (isInitialized) {
 *   // Pronto para usar Brick
 * }
 */
export function useMercadoPagoInit(publicKey?: string): boolean {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!publicKey) {
      setIsInitialized(false);
      return;
    }

    const initMP = async () => {
      try {
        // Carregar script do Mercado Pago
        if (!window.MercadoPago) {
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          script.onload = () => {
            if (window.MercadoPago) {
              new window.MercadoPago(publicKey, {
                locale: "pt-BR",
              });
              console.log("[MercadoPago] ✅ SDK carregada e inicializada");
              setIsInitialized(true);
            }
          };
          script.onerror = () => {
            console.error("[MercadoPago] Erro ao carregar SDK");
            setIsInitialized(false);
          };
          document.head.appendChild(script);
        } else {
          // SDK já carregada
          new window.MercadoPago(publicKey, {
            locale: "pt-BR",
          });
          console.log("[MercadoPago] SDK já estava carregada");
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("[MercadoPago] Erro ao inicializar:", error);
        setIsInitialized(false);
      }
    };

    initMP();
  }, [publicKey]);

  return isInitialized;
}

/**
 * Hook para verificar se o Mercado Pago está disponível
 * 
 * @param integration - Integração do Mercado Pago
 * @returns true se disponível e ativo
 * 
 * @example
 * const isAvailable = useMercadoPagoAvailable(integration);
 * 
 * if (isAvailable) {
 *   // Mostrar opção de pagamento
 * }
 */
export function useMercadoPagoAvailable(
  integration: MercadoPagoIntegration | null | undefined
): boolean {
  // Validação: integração inválida ou desativada
  if (!integration || !integration.active) {
    return false;
  }

  // Validação: public key configurada
  if (!integration.config?.public_key) {
    return false;
  }

  return true;
}

// Import React para useEffect
import React from "react";
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Interfaces para useMercadoPagoBrick
 */
interface UseMercadoPagoBrickProps {
  amount: number;
  publicKey: string;
  payerEmail: string;
  onFormMounted?: () => void;
  onFormError?: (error: string) => void;
}

interface FieldErrors {
  cardNumber?: string;
  expirationDate?: string;
  securityCode?: string;
  cardholderName?: string;
  identificationNumber?: string;
  installments?: string;
}

/**
 * Hook para gerenciar o formulário de cartão customizado do Mercado Pago
 * 
 * Usa a Card Form API (baixo nível) do Mercado Pago para controle total
 * sobre validação, campos customizados e UX.
 * 
 * Migrado de: src/hooks/useMercadoPagoBrick.ts
 * 
 * @param props - Configurações do formulário
 * @returns Estado e métodos do formulário
 * 
 * @example
 * const { isReady, installments, fieldErrors, submit } = useMercadoPagoBrick({
 *   amount: 100,
 *   publicKey: 'APP_USR-...',
 *   payerEmail: 'user@example.com',
 *   onFormError: (msg) => toast.error(msg)
 * });
 */
export function useMercadoPagoBrick({
  amount,
  publicKey,
  payerEmail,
  onFormMounted,
  onFormError
}: UseMercadoPagoBrickProps) {
  const [isReady, setIsReady] = useState(false);
  const [installments, setInstallments] = useState<any[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const cardFormRef = useRef<any>(null);
  const isMountingRef = useRef(false); // Novo ref para evitar race conditions
  const paymentMethodRef = useRef<string>(""); 
  const amountRef = useRef(amount); 

  useEffect(() => { amountRef.current = amount; }, [amount]);

  const clearFieldError = useCallback((field: keyof FieldErrors) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Polling de Foco (UX)
  useEffect(() => {
    if (!isReady) return;
    let lastActiveField = '';
    const interval = setInterval(() => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'IFRAME') {
        const parentDiv = activeElement.parentElement;
        let currentField = '';
        if (parentDiv?.id === 'form-checkout__cardNumber') currentField = 'cardNumber';
        else if (parentDiv?.id === 'form-checkout__expirationDate') currentField = 'expirationDate';
        else if (parentDiv?.id === 'form-checkout__securityCode') currentField = 'securityCode';
        
        if (currentField && currentField !== lastActiveField) {
          clearFieldError(currentField as keyof FieldErrors);
          lastActiveField = currentField;
        }
      } else {
        lastActiveField = '';
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isReady, clearFieldError]);

  // Inicialização SDK - CORRIGIDA
  useEffect(() => {
    // 1. Verificações de segurança
    if (!publicKey || !window.MercadoPago) return;
    if (cardFormRef.current || isMountingRef.current) {
        console.log('[MercadoPago] Instância já existe ou está montando.');
        return;
    }
    
    const formElement = document.getElementById('form-checkout');
    if (!formElement) return;

    // 2. Travar montagem múltipla
    isMountingRef.current = true;
    console.log('[useMercadoPagoBrick] Inicializando SDK...');

    const initBrick = async () => {
      try {
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });

        // Simulação inicial de parcelas
        try {
            const data = await mp.getInstallments({
                amount: amountRef.current.toString(),
                bin: '520000', 
                locale: 'pt-BR'
            });
            if (data?.[0]?.payer_costs) setInstallments(data[0].payer_costs);
        } catch (e) {
            console.warn("[Installments] Erro simul:", e);
        }

      const cardForm = mp.cardForm({
        amount: amountRef.current.toString(),
        iframe: true,
        form: {
          id: "form-checkout",
          cardNumber: { 
            id: "form-checkout__cardNumber",
            placeholder: "0000 0000 0000 0000",
            style: { color: '#000000', fontSize: '14px' }
          },
          expirationDate: { 
            id: "form-checkout__expirationDate",
            placeholder: "MM/AA",
            style: { color: '#000000', fontSize: '14px' }
          },
          securityCode: { 
            id: "form-checkout__securityCode",
            placeholder: "123",
            style: { color: '#000000', fontSize: '14px' }
          },
          cardholderName: { id: "form-checkout__cardholderName" },
          issuer: { id: "form-checkout__issuer" },
          installments: { id: "form-checkout__installments" },
          identificationType: { id: "form-checkout__identificationType" },
          identificationNumber: { id: "form-checkout__identificationNumber" },
          cardholderEmail: { id: "form-checkout__cardholderEmail" },
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) {
               console.warn("Erro mount:", error);
               isMountingRef.current = false;
               setIsReady(false);
               return;
            }
            setIsReady(true);
            onFormMounted?.();
          },
          onBinChange: (bin: string) => {
             clearFieldError('cardNumber');
          },
          onPaymentMethodsReceived: (error: any, methods: any) => {
            if (!error && methods?.[0]) {
              paymentMethodRef.current = methods[0].id;
              const input = document.getElementById('paymentMethodId') as HTMLInputElement;
              if (input) input.value = methods[0].id;
            }
          },
          onInstallmentsReceived: (error: any, data: any) => {
            if (!error && data?.[0]?.payer_costs) {
              setInstallments(data[0].payer_costs);
            }
          },
          onFormTokenError: (error: any) => { 
             // Deixa o catch do submit lidar
          }
        },
      });

        cardFormRef.current = cardForm;

      } catch (error) {
        console.error('[useMercadoPagoBrick] Erro fatal:', error);
        onFormError?.('Falha ao inicializar sistema de pagamento');
        setIsReady(false);
        isMountingRef.current = false;
        cardFormRef.current = null;
      }
    };

    initBrick();

    // Limpeza ao desmontar
    return () => {
        console.log('[useMercadoPagoBrick] Desmontando...');
        if (cardFormRef.current) {
            try {
                // Tenta desmontar se o método existir
                if (typeof cardFormRef.current.unmount === 'function') {
                    cardFormRef.current.unmount();
                }
            } catch(e) {
                console.log('Erro ao desmontar brick:', e);
            }
            cardFormRef.current = null;
        }
        isMountingRef.current = false;
        setIsReady(false);
    };
  }, [publicKey]); // Dependência única para evitar re-inits desnecessários 

  // Recálculo parcelas
  useEffect(() => {
    if (!isReady || !window.MercadoPago) return;
    const timer = setTimeout(() => {
        try {
          const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
          mp.getInstallments({
            amount: amount.toString(),
            bin: '520000',
            locale: 'pt-BR'
          }).then((data: any) => {
            if (data?.[0]?.payer_costs) setInstallments(data[0].payer_costs);
          });
        } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, isReady, publicKey]);

  const submit = async () => {
    if (!cardFormRef.current) throw new Error('Formulário não inicializado');

    const docInput = document.getElementById('docNumberVisual') as HTMLInputElement;
    if (docInput) {
        const cleanDoc = docInput.value.replace(/\D/g, '');
        const hiddenDoc = document.getElementById('form-checkout__identificationNumber') as HTMLInputElement;
        const hiddenType = document.getElementById('form-checkout__identificationType') as HTMLSelectElement;
        if (hiddenDoc) { hiddenDoc.value = cleanDoc; hiddenDoc.dispatchEvent(new Event('input', { bubbles: true })); }
        if (hiddenType) { hiddenType.value = cleanDoc.length > 11 ? 'CNPJ' : 'CPF'; hiddenType.dispatchEvent(new Event('change', { bubbles: true })); }
    }

    try {
        const tokenData = await cardFormRef.current.createCardToken({
          cardholderEmail: payerEmail,
        });

        if (!tokenData?.id && !tokenData?.token) {
            throw new Error('Verifique os dados do cartão');
        }

        setFieldErrors({}); 
        return {
            token: tokenData.id || tokenData.token,
            paymentMethodId: paymentMethodRef.current || (document.getElementById('paymentMethodId') as HTMLInputElement)?.value,
            installments: (document.getElementById('form-checkout__installments') as HTMLSelectElement)?.value,
            issuerId: (document.getElementById('form-checkout__issuer') as HTMLSelectElement)?.value
        };

    } catch (error: any) {
        const rawList = Array.isArray(error) ? error : (error.cause || [error]);
        const errorList = Array.isArray(rawList) ? rawList : [rawList];
        
        const mappedErrors: FieldErrors = {};
        
        errorList.forEach((e: any) => {
            const code = String(e.code || '');
            const msg = String(e.message || '').toLowerCase();
            const desc = String(e.description || '').toLowerCase();
            
            // CARTÃO
            if (
                ['205', 'E301', '3034'].includes(code) || 
                msg.includes('card number') || msg.includes('card_number') ||
                desc.includes('card number') || desc.includes('card_number')
            ) {
                mappedErrors.cardNumber = "Número inválido";
            }

            // VALIDADE
            else if (
                ['208', '209', '325', '326'].includes(code) || 
                msg.includes('expiration') || msg.includes('date') ||
                desc.includes('expiration') || desc.includes('date')
            ) {
                mappedErrors.expirationDate = "Data inválida";
            }

            // CVV
            else if (
                ['220', '221', '224', '225', '226', 'E302'].includes(code) || 
                msg.includes('security') || msg.includes('cvv') || msg.includes('security_code') ||
                desc.includes('security') || desc.includes('cvv') || desc.includes('security_code')
            ) {
                mappedErrors.securityCode = "CVV inválido";
            }
            // QUALQUER OUTRA COISA -> CARTÃO (Fallback)
            else {
                mappedErrors.cardNumber = "Número inválido";
            }
        });

        if (Object.keys(mappedErrors).length > 0) {
             setFieldErrors(mappedErrors);
        } else {
             // Caso venha uma lista totalmente vazia
             console.warn("⚠️ [FALLBACK] SDK falhou sem lista de erros.");
             setFieldErrors({
                cardNumber: "Obrigatório",
                expirationDate: "Obrigatório",
                securityCode: "Obrigatório"
             });
        }
        throw error;
    }
  };

  return { isReady, installments, fieldErrors, clearFieldError, submit };
}
