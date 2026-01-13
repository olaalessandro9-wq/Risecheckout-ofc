/**
 * useMercadoPagoBrick - Hook para gerenciar formulário de cartão customizado
 * 
 * Responsabilidade única: Gerenciar Card Form API do Mercado Pago
 * Limite: < 300 linhas
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Interfaces para useMercadoPagoBrick
 */
export interface UseMercadoPagoBrickProps {
  amount: number;
  publicKey: string;
  payerEmail: string;
  onFormMounted?: () => void;
  onFormError?: (error: string) => void;
}

export interface FieldErrors {
  cardNumber?: string;
  expirationDate?: string;
  securityCode?: string;
  cardholderName?: string;
  identificationNumber?: string;
  installments?: string;
}

export interface MercadoPagoBrickReturn {
  isReady: boolean;
  installments: MercadoPagoInstallment[];
  fieldErrors: FieldErrors;
  clearFieldError: (field: keyof FieldErrors) => void;
  submit: () => Promise<MercadoPagoTokenResult>;
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

/**
 * Hook para gerenciar o formulário de cartão customizado do Mercado Pago
 * 
 * Usa a Card Form API (baixo nível) do Mercado Pago para controle total
 * sobre validação, campos customizados e UX.
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
}: UseMercadoPagoBrickProps): MercadoPagoBrickReturn {
  const [isReady, setIsReady] = useState(false);
  const [installments, setInstallments] = useState<MercadoPagoInstallment[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  const cardFormRef = useRef<unknown>(null);
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
        console.log('[MercadoPago] Instância já existe ou está montando.');
        return;
    }
    
    const formElement = document.getElementById('form-checkout');
    if (!formElement) return;

    isMountingRef.current = true;
    console.log('[useMercadoPagoBrick] Inicializando SDK...');

    const initBrick = async () => {
      try {
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });

        // Simulação inicial de parcelas
        try {
            interface InstallmentResponse {
              payer_costs: MercadoPagoInstallment[];
            }
            const data = await mp.getInstallments({
                amount: amountRef.current.toString(),
                bin: '520000', 
                locale: 'pt-BR'
            });
            const installmentData = data as InstallmentResponse[];
            if (installmentData?.[0]?.payer_costs) setInstallments(installmentData[0].payer_costs);
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
          onFormMounted: (error: unknown) => {
            if (error) {
               console.warn("Erro mount:", error);
               isMountingRef.current = false;
               setIsReady(false);
               return;
            }
            setIsReady(true);
            onFormMounted?.();
          },
          onBinChange: () => {
             clearFieldError('cardNumber');
          },
          onPaymentMethodsReceived: (error: unknown, methods: Array<{ id: string }>) => {
            if (!error && methods?.[0]) {
              paymentMethodRef.current = methods[0].id;
              const input = document.getElementById('paymentMethodId') as HTMLInputElement;
              if (input) input.value = methods[0].id;
            }
          },
          onInstallmentsReceived: (error: unknown, data: Array<{ payer_costs: MercadoPagoInstallment[] }>) => {
            if (!error && data?.[0]?.payer_costs) {
              setInstallments(data[0].payer_costs);
            }
          },
          onFormTokenError: () => { 
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

    return () => {
        console.log('[useMercadoPagoBrick] Desmontando...');
        if (cardFormRef.current) {
            try {
                const formInstance = cardFormRef.current as { unmount?: () => void };
                if (typeof formInstance.unmount === 'function') {
                    formInstance.unmount();
                }
            } catch(e) {
                console.log('Erro ao desmontar brick:', e);
            }
            cardFormRef.current = null;
        }
        isMountingRef.current = false;
        setIsReady(false);
    };
  }, [publicKey, clearFieldError, onFormError, onFormMounted]);

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
          }).then((data: Array<{ payer_costs: MercadoPagoInstallment[] }>) => {
            if (data?.[0]?.payer_costs) setInstallments(data[0].payer_costs);
          }).catch((err: unknown) => {
            console.warn('[MercadoPago] Erro ao recalcular parcelas:', err);
          });
        } catch (err: unknown) {
          console.warn('[MercadoPago] Erro ao iniciar recálculo de parcelas:', err);
        }
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
        const formInstance = cardFormRef.current as { createCardToken: (opts: { cardholderEmail: string }) => Promise<{ id?: string; token?: string }> };
        const tokenData = await formInstance.createCardToken({
          cardholderEmail: payerEmail,
        });

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
        const errorObj = error as { cause?: unknown };
        const rawList = Array.isArray(error) ? error : (errorObj.cause || [error]);
        const errorList = Array.isArray(rawList) ? rawList : [rawList];
        
        const mappedErrors: FieldErrors = {};
        
        errorList.forEach((e: unknown) => {
            const errItem = e as { code?: string; message?: string; description?: string };
            const code = String(errItem.code || '');
            const msg = String(errItem.message || '').toLowerCase();
            const desc = String(errItem.description || '').toLowerCase();
            
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
