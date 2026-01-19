/**
 * useMercadoPagoBrick - Hook para gerenciar formulário de cartão customizado
 * 
 * Módulo: src/integrations/gateways/mercadopago/hooks/useMercadoPagoBrick.ts
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Responsabilidade única: Gerenciar Card Form API do Mercado Pago
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  initCardForm, 
  recalculateInstallments, 
  CardFormInstance 
} from './brick-sdk-init';
import { 
  mapTokenErrors, 
  getFallbackErrors, 
  FieldErrors 
} from './brick-error-mapper';
import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPago");

export interface UseMercadoPagoBrickProps {
  amount: number;
  publicKey: string;
  payerEmail: string;
  onFormMounted?: () => void;
  onFormError?: (error: string) => void;
}

export interface MercadoPagoInstallment {
  installments: number;
  installment_rate: number;
  discount_rate: number;
  labels: string[];
  min_allowed_amount: number;
  max_allowed_amount: number;
  recommended_message: string;
  installment_amount: number;
  total_amount: number;
}

export interface MercadoPagoTokenResult {
  token: string;
  paymentMethodId: string;
  installments: string;
  issuerId: string;
}

export interface MercadoPagoBrickReturn {
  isReady: boolean;
  installments: MercadoPagoInstallment[];
  fieldErrors: FieldErrors;
  clearFieldError: (field: keyof FieldErrors) => void;
  submit: () => Promise<MercadoPagoTokenResult>;
}

// Re-export FieldErrors for external use
export type { FieldErrors };

export function useMercadoPagoBrick({
  amount,
  publicKey,
  payerEmail,
  onFormMounted,
  onFormError
}: UseMercadoPagoBrickProps): MercadoPagoBrickReturn {
  const [isReady, setIsReady] = useState(false);
  const [installments, setInstallments] = useState<MercadoPagoInstallment[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const cardFormRef = useRef<CardFormInstance | null>(null);
  const isMountingRef = useRef(false);
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

  // Inicialização SDK
  useEffect(() => {
    if (!publicKey || !window.MercadoPago) return;
    if (cardFormRef.current || isMountingRef.current) {
      log.debug("Instância já existe ou está montando");
      return;
    }
    
    const formElement = document.getElementById('form-checkout');
    if (!formElement) return;

    isMountingRef.current = true;
    log.debug("Inicializando SDK...");

    const initBrick = async () => {
      try {
        const cardForm = await initCardForm({
          publicKey,
          amount: amountRef.current,
          onFormMounted: (error) => {
            if (error) {
              log.warn("Erro mount", error);
              isMountingRef.current = false;
              setIsReady(false);
              return;
            }
            setIsReady(true);
            onFormMounted?.();
          },
          onBinChange: () => clearFieldError('cardNumber'),
          onPaymentMethodsReceived: (error, methods) => {
            if (!error && methods?.[0]) {
              paymentMethodRef.current = methods[0].id;
              const input = document.getElementById('paymentMethodId') as HTMLInputElement;
              if (input) input.value = methods[0].id;
            }
          },
          onInstallmentsReceived: (error, data) => {
            if (!error && data?.[0]?.payer_costs) {
              setInstallments(data[0].payer_costs);
            }
          },
          onFormTokenError: () => { /* Deixa o catch do submit lidar */ }
        });

        cardFormRef.current = cardForm;
      } catch (error: unknown) {
        log.error("Erro fatal ao inicializar", error);
        onFormError?.('Falha ao inicializar sistema de pagamento');
        setIsReady(false);
        isMountingRef.current = false;
        cardFormRef.current = null;
      }
    };

    initBrick();

    return () => {
      log.debug("Desmontando...");
      if (cardFormRef.current?.unmount) {
        try { 
          cardFormRef.current.unmount(); 
        } catch(e) { 
          log.warn("Erro ao desmontar brick", e); 
        }
      }
      cardFormRef.current = null;
      isMountingRef.current = false;
      setIsReady(false);
    };
  }, [publicKey, clearFieldError, onFormError, onFormMounted]);

  // Recálculo parcelas
  useEffect(() => {
    if (!isReady || !window.MercadoPago) return;
    const timer = setTimeout(async () => {
      const newInstallments = await recalculateInstallments(publicKey, amount);
      if (newInstallments) setInstallments(newInstallments);
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, isReady, publicKey]);

  const submit = async (): Promise<MercadoPagoTokenResult> => {
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
      const tokenData = await cardFormRef.current.createCardToken({ cardholderEmail: payerEmail });

      if (!tokenData?.id && !tokenData?.token) {
        throw new Error('Verifique os dados do cartão');
      }

      setFieldErrors({}); 
      return {
        token: tokenData.id || tokenData.token || '',
        paymentMethodId: paymentMethodRef.current || (document.getElementById('paymentMethodId') as HTMLInputElement)?.value || '',
        installments: (document.getElementById('form-checkout__installments') as HTMLSelectElement)?.value || '1',
        issuerId: (document.getElementById('form-checkout__issuer') as HTMLSelectElement)?.value || ''
      };
    } catch (error: unknown) {
      const mappedErrors = mapTokenErrors(error);
      
      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors(mappedErrors);
      } else {
        log.warn("SDK falhou sem lista de erros (fallback ativado)");
        setFieldErrors(getFallbackErrors());
      }
      throw error;
    }
  };

  return { isReady, installments, fieldErrors, clearFieldError, submit };
}
