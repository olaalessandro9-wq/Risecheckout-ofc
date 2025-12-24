/**
 * MercadoPagoFields - Campos específicos do Mercado Pago
 * 
 * Componente que renderiza os 3 iframes do Mercado Pago:
 * - Número do cartão
 * - Data de expiração
 * - CVV
 * 
 * Estes campos são controlados pelo SDK do Mercado Pago e não podem
 * ter customização completa de estilo (especialmente font-family).
 */

import { memo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { INPUT_BASE_CLASS, INPUT_ERROR_CLASS } from '../../core/constants';

export interface MercadoPagoFieldsProps {
  publicKey: string;
  amount: number;
  payerEmail: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onBinChange?: (bin: string) => void;
  onInstallmentsChange?: (installments: any[]) => void;
}

export interface MercadoPagoFieldsRef {
  /**
   * Cria token do cartão
   * @returns Dados do token incluindo paymentMethodId, issuerId
   */
  createToken: () => Promise<{
    token: string;
    paymentMethodId: string;
    issuerId: string;
    installments: string;
  }>;
  
  /**
   * Limpa erro de um campo específico
   */
  clearFieldError: (field: 'cardNumber' | 'expirationDate' | 'securityCode') => void;
  
  /**
   * Retorna erros atuais dos campos
   */
  getFieldErrors: () => FieldErrors;
}

// FieldErrors agora definido acima do componente

interface FieldErrors {
  cardNumber?: string;
  expirationDate?: string;
  securityCode?: string;
}

const MercadoPagoFieldsComponent = forwardRef<MercadoPagoFieldsRef, MercadoPagoFieldsProps>(
  ({ publicKey, amount, payerEmail, onReady, onError, onBinChange, onInstallmentsChange }, ref) => {
    const [isReady, setIsReady] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    
    const cardFormRef = useRef<any>(null);
    const isMountingRef = useRef(false);
    const paymentMethodRef = useRef<string>("");
    const amountRef = useRef(amount);

    useEffect(() => {
      amountRef.current = amount;
    }, [amount]);

    const clearFieldError = (field: keyof FieldErrors) => {
      setFieldErrors(prev => {
        if (!prev[field]) return prev;
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    };

    const getFieldErrors = () => fieldErrors;

    // Expõe métodos via ref
    useImperativeHandle(ref, () => ({
      createToken: async () => {
        if (!cardFormRef.current) {
          throw new Error('Formulário não inicializado');
        }

        try {
          const tokenData = await cardFormRef.current.createCardToken({
            cardholderEmail: payerEmail,
          });

          if (!tokenData?.id && !tokenData?.token) {
            throw new Error('Verifique os dados do cartão');
          }

          setFieldErrors({});
          
          const installmentsSelect = document.getElementById('form-checkout__installments') as HTMLSelectElement;
          const issuerSelect = document.getElementById('form-checkout__issuer') as HTMLSelectElement;
          const paymentMethodInput = document.getElementById('paymentMethodId') as HTMLInputElement;

          return {
            token: tokenData.id || tokenData.token,
            paymentMethodId: paymentMethodRef.current || paymentMethodInput?.value || '',
            issuerId: issuerSelect?.value || '',
            installments: installmentsSelect?.value || '1',
          };
        } catch (error: any) {
          // Mapeia erros do SDK para campos específicos
          const rawList = Array.isArray(error) ? error : (error.cause || [error]);
          const errorList = Array.isArray(rawList) ? rawList : [rawList];
          
          const mappedErrors: FieldErrors = {};
          
          errorList.forEach((e: any) => {
            const code = String(e.code || '');
            const msg = String(e.message || '').toLowerCase();
            const desc = String(e.description || '').toLowerCase();
            
            if (
              ['205', 'E301', '3034'].includes(code) || 
              msg.includes('card number') || msg.includes('card_number') ||
              desc.includes('card number') || desc.includes('card_number')
            ) {
              mappedErrors.cardNumber = "Número inválido";
            } else if (
              ['208', '209', '325', '326'].includes(code) || 
              msg.includes('expiration') || msg.includes('date') ||
              desc.includes('expiration') || desc.includes('date')
            ) {
              mappedErrors.expirationDate = "Data inválida";
            } else if (
              ['220', '221', '224', '225', '226', 'E302'].includes(code) || 
              msg.includes('security') || msg.includes('cvv') || msg.includes('security_code') ||
              desc.includes('security') || desc.includes('cvv') || desc.includes('security_code')
            ) {
              mappedErrors.securityCode = "CVV inválido";
            } else {
              mappedErrors.cardNumber = "Número inválido";
            }
          });

          if (Object.keys(mappedErrors).length > 0) {
            setFieldErrors(mappedErrors);
          } else {
            setFieldErrors({
              cardNumber: "Obrigatório",
              expirationDate: "Obrigatório",
              securityCode: "Obrigatório"
            });
          }
          
          throw error;
        }
      },
      clearFieldError,
      getFieldErrors,
    }));

    // Polling de foco para limpar erros quando usuário clica no campo
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
    }, [isReady]);

    // Inicialização do SDK do Mercado Pago
    useEffect(() => {
      if (!publicKey || !window.MercadoPago) return;
      if (cardFormRef.current || isMountingRef.current) {
        console.log('[MercadoPagoFields] Instância já existe ou está montando');
        return;
      }
      
      const formElement = document.getElementById('form-checkout');
      if (!formElement) return;

      isMountingRef.current = true;
      console.log('[MercadoPagoFields] Inicializando SDK...');

      const initBrick = async () => {
        try {
          const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });

          // Busca parcelas iniciais
          try {
            const data = await mp.getInstallments({
              amount: amountRef.current.toString(),
              bin: '520000',
              locale: 'pt-BR'
            });
            if (data?.[0]?.payer_costs) {
              onInstallmentsChange?.(data[0].payer_costs);
            }
          } catch (e) {
            console.warn("[MercadoPagoFields] Erro ao buscar parcelas:", e);
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
                  console.warn("[MercadoPagoFields] Erro ao montar:", error);
                  isMountingRef.current = false;
                  setIsReady(false);
                  onError?.('Erro ao carregar formulário de pagamento');
                  return;
                }
                setIsReady(true);
                onReady?.();
              },
              onBinChange: (bin: string) => {
                clearFieldError('cardNumber');
                onBinChange?.(bin);
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
                  onInstallmentsChange?.(data[0].payer_costs);
                }
              },
            },
          });

          cardFormRef.current = cardForm;
        } catch (error) {
          console.error('[MercadoPagoFields] Erro fatal:', error);
          onError?.('Falha ao inicializar sistema de pagamento');
          setIsReady(false);
          isMountingRef.current = false;
          cardFormRef.current = null;
        }
      };

      initBrick();

      return () => {
        console.log('[MercadoPagoFields] Desmontando...');
        if (cardFormRef.current) {
          try {
            if (typeof cardFormRef.current.unmount === 'function') {
              cardFormRef.current.unmount();
            }
          } catch (e) {
            console.log('Erro ao desmontar:', e);
          }
          cardFormRef.current = null;
        }
        isMountingRef.current = false;
        setIsReady(false);
      };
    }, [publicKey]);

    // Recálculo de parcelas quando amount muda
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
            if (data?.[0]?.payer_costs) {
              onInstallmentsChange?.(data[0].payer_costs);
            }
          });
        } catch (e) {
          console.warn('Erro ao recalcular parcelas:', e);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }, [amount, isReady, publicKey]);

    const inputClass = INPUT_BASE_CLASS;
    const errorClass = INPUT_ERROR_CLASS;

    return (
      <div className="space-y-4">
        {/* Número do Cartão */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Número do Cartão</label>
          <div 
            id="form-checkout__cardNumber" 
            className={`${inputClass} flex items-center ${fieldErrors.cardNumber ? errorClass : 'border-gray-300'}`}
          />
          {fieldErrors.cardNumber && (
            <p className="text-red-500 text-xs font-medium">{fieldErrors.cardNumber}</p>
          )}
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Validade</label>
            <div 
              id="form-checkout__expirationDate" 
              className={`${inputClass} flex items-center ${fieldErrors.expirationDate ? errorClass : 'border-gray-300'}`}
            />
            {fieldErrors.expirationDate && (
              <p className="text-red-500 text-xs font-medium">{fieldErrors.expirationDate}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">CVV</label>
            <div 
              id="form-checkout__securityCode" 
              className={`${inputClass} flex items-center ${fieldErrors.securityCode ? errorClass : 'border-gray-300'}`}
            />
            {fieldErrors.securityCode && (
              <p className="text-red-500 text-xs font-medium">{fieldErrors.securityCode}</p>
            )}
          </div>
        </div>

        {/* Campos ocultos necessários para o SDK */}
        <div className="hidden">
          <input type="email" id="form-checkout__cardholderEmail" value={payerEmail} readOnly />
          <select id="form-checkout__identificationType">
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
          <input type="text" id="form-checkout__identificationNumber" />
          <input type="text" id="form-checkout__cardholderName" />
          <input type="hidden" id="paymentMethodId" />
          <select id="form-checkout__issuer"></select>
          <select id="form-checkout__installments"></select>
        </div>

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }
);

MercadoPagoFieldsComponent.displayName = 'MercadoPagoFields';

export const MercadoPagoFields = memo(MercadoPagoFieldsComponent);
