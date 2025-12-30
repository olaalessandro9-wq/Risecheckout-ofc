/**
 * MercadoPagoCardForm - REFATORADO
 * 
 * Componente principal do formulário de cartão usando @mercadopago/sdk-react
 * 
 * REFATORAÇÃO:
 * - Lógica de estado → useCardFormState
 * - Lógica de validação → useCardValidation  
 * - Resolução de BIN → useBinResolution
 * - Parcelas reais do MP → useMercadoPagoInstallments
 * - Campos seguros → SecureFields + SecureFieldsPortal
 * - Dropdown custom → InstallmentsDropdown (sem azul do SO)
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { initMercadoPago, createCardToken } from '@mercadopago/sdk-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Calendar, Lock, User, ShieldCheck } from 'lucide-react';
import type { CardFormProps, CardTokenResult } from '@/types/payment-types';

// Hooks refatorados
import { useCardValidation, useBinResolution, useMercadoPagoInstallments } from './hooks';

// Componentes refatorados
import { SecureFieldsPortal, InstallmentsDropdown } from './components';

// Controle de inicialização global do SDK
let lastInitializedPublicKey: string | null = null;

// Estilo compartilhado
const inputContainerStyle = "relative flex h-10 w-full items-center rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";

export const MercadoPagoCardForm: React.FC<CardFormProps & { 
  textColor?: string, 
  placeholderColor?: string,
  backgroundColor?: string,
  borderColor?: string 
}> = ({
  publicKey,
  amount,
  maxInstallments,
  onSubmit,
  onError,
  onReady,
  onMount,
  isProcessing = false,
  textColor = '#ffffff',
  placeholderColor = '#9ca3af',
  backgroundColor = 'transparent',
  borderColor = 'hsl(var(--border))'
}) => {
  // Estados locais do formulário
  const [cardholderName, setCardholderName] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState('1');
  
  // Refs para valores atuais (usados no submit sem causar re-render)
  const cardholderNameRef = useRef('');
  const identificationNumberRef = useRef('');
  const selectedInstallmentRef = useRef('1');

  // Manter refs sincronizadas
  useEffect(() => { cardholderNameRef.current = cardholderName; }, [cardholderName]);
  useEffect(() => { identificationNumberRef.current = identificationNumber; }, [identificationNumber]);
  useEffect(() => { selectedInstallmentRef.current = selectedInstallment; }, [selectedInstallment]);

  // Hook de validação
  const {
    errors,
    setErrors,
    clearError,
    clearCardNumberError,
    clearExpirationDateError,
    clearSecurityCodeError,
    validateLocalFields,
    mapMPErrorsToFields,
    setHasAttemptedSubmit
  } = useCardValidation();

  // Hook de resolução de BIN (agora expõe bin e paymentMethodId como estado)
  const { paymentMethodIdRef, issuerIdRef, bin, paymentMethodId, handleBinChange } = useBinResolution();

  // Hook de parcelas reais do MP
  const { installments, isLoading: isLoadingInstallments, source: installmentsSource } = useMercadoPagoInstallments({
    amountCents: amount,
    bin,
    paymentMethodId,
    maxInstallments
  });

  const onMountCalledRef = useRef(false);

  // Quando parcelas mudam, garantir que selectedInstallment é válido
  useEffect(() => {
    if (installments.length > 0) {
      const currentValid = installments.some(i => i.value?.toString() === selectedInstallment);
      if (!currentValid) {
        const firstValue = installments[0].value?.toString() || '1';
        setSelectedInstallment(firstValue);
        console.log('[MercadoPagoCardForm] Ajustando parcela selecionada para:', firstValue);
      }
    }
  }, [installments, selectedInstallment]);

  // Log de debug para parcelas
  useEffect(() => {
    console.log('[MercadoPagoCardForm] Parcelas atuais:', installments.length, 'fonte:', installmentsSource, 'BIN:', bin);
  }, [installments, installmentsSource, bin]);

  // Inicializar SDK
  useEffect(() => {
    if (publicKey && publicKey !== lastInitializedPublicKey) {
      try {
        console.log('[MercadoPagoCardForm] Inicializando SDK');
        initMercadoPago(publicKey, { locale: 'pt-BR' });
        lastInitializedPublicKey = publicKey;
      } catch (e) {
        console.log('[MercadoPagoCardForm] Erro ao inicializar SDK:', e);
        lastInitializedPublicKey = publicKey;
      }
    }
  }, [publicKey]);

  // Callback quando SecureFields estão prontos
  const handleSecureFieldsReady = useCallback(() => {
    onReady?.();
  }, [onReady]);

  // Formatação de CPF
  const formatCPF = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }, []);

  // Função de submit
  const handleSubmit = useCallback(async () => {
    console.log('[MercadoPagoCardForm] Submit chamado');
    setHasAttemptedSubmit(true);
    
    const currentName = cardholderNameRef.current || '';
    const currentCPF = identificationNumberRef.current || '';
    const currentInstallment = selectedInstallmentRef.current || '1';
    
    // Validação local
    const localErrors = validateLocalFields(currentName, currentCPF);

    try {
      const token = await createCardToken({
        cardholderName: currentName.toUpperCase() || 'NOME OBRIGATORIO',
        identificationType: 'CPF',
        identificationNumber: currentCPF.replace(/\D/g, '') || '00000000000',
      });

      if (Object.keys(localErrors).length > 0) {
        setErrors(localErrors);
        return;
      }

      if (token?.id) {
        const tokenAny = token as any;
        const resolvedPaymentMethodId = paymentMethodIdRef.current || tokenAny.payment_method?.id || '';
        const resolvedIssuerId = issuerIdRef.current || tokenAny.issuer?.id?.toString() || '';
        
        if (!resolvedPaymentMethodId) {
          setErrors({ cardNumber: 'Não foi possível identificar a bandeira do cartão.' });
          return;
        }
        
        const result: CardTokenResult = {
          token: token.id,
          paymentMethodId: resolvedPaymentMethodId,
          issuerId: resolvedIssuerId,
          installments: parseInt(currentInstallment, 10),
          holderDocument: currentCPF.replace(/\D/g, ''),
        };

        onSubmit(result);
      } else {
        throw new Error('Token não foi gerado');
      }
    } catch (error: any) {
      console.error('[MercadoPagoCardForm] Erro ao criar token:', error);
      
      const mpErrors = mapMPErrorsToFields(error);
      setErrors({ ...localErrors, ...mpErrors });
      
      if (mpErrors.submit) {
        onError?.(new Error(mpErrors.submit));
      }
    }
  }, [onSubmit, onError, validateLocalFields, mapMPErrorsToFields, setErrors, setHasAttemptedSubmit]);

  // Expor função de submit via onMount
  useEffect(() => {
    if (onMount && !onMountCalledRef.current) {
      onMountCalledRef.current = true;
      onMount(handleSubmit);
    }
  }, [onMount, handleSubmit]);

  return (
    <div className="space-y-4">
      {/* Número do Cartão */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.cardNumber ? 'text-red-500' : ''}`}>
          Número do cartão
        </Label>
        <div 
          className={`${inputContainerStyle} ${errors.cardNumber ? 'border-red-500 ring-red-500' : ''}`}
          style={{ backgroundColor, borderColor: errors.cardNumber ? undefined : borderColor }}
        >
          <CreditCard className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.cardNumber ? 'text-red-500' : 'text-gray-400'}`} />
          <div id="mp-card-number-slot" className="flex-1 h-full" />
        </div>
        {errors.cardNumber && <span className="text-xs text-red-500 mt-0.5">{errors.cardNumber}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Validade */}
        <div className="space-y-1">
          <Label className={`text-[11px] font-normal opacity-70 ${errors.expirationDate ? 'text-red-500' : ''}`}>
            Validade
          </Label>
          <div 
            className={`${inputContainerStyle} ${errors.expirationDate ? 'border-red-500 ring-red-500' : ''}`}
            style={{ backgroundColor, borderColor: errors.expirationDate ? undefined : borderColor }}
          >
            <Calendar className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.expirationDate ? 'text-red-500' : 'text-gray-400'}`} />
            <div id="mp-expiration-slot" className="flex-1 h-full" />
          </div>
          {errors.expirationDate && <span className="text-xs text-red-500 mt-0.5">{errors.expirationDate}</span>}
        </div>

        {/* CVV */}
        <div className="space-y-1">
          <Label className={`text-[11px] font-normal opacity-70 ${errors.securityCode ? 'text-red-500' : ''}`}>
            CVV
          </Label>
          <div 
            className={`${inputContainerStyle} ${errors.securityCode ? 'border-red-500 ring-red-500' : ''}`}
            style={{ backgroundColor, borderColor: errors.securityCode ? undefined : borderColor }}
          >
            <Lock className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.securityCode ? 'text-red-500' : 'text-gray-400'}`} />
            <div id="mp-security-slot" className="flex-1 h-full" />
          </div>
          {errors.securityCode && <span className="text-xs text-red-500 mt-0.5">{errors.securityCode}</span>}
        </div>
      </div>

      {/* SecureFields Portal */}
      <SecureFieldsPortal 
        onReady={handleSecureFieldsReady}
        textColor={textColor}
        placeholderColor={placeholderColor}
        onCardNumberChange={clearCardNumberError}
        onExpirationDateChange={clearExpirationDateError}
        onSecurityCodeChange={clearSecurityCodeError}
        onBinChange={handleBinChange}
      />

      {/* Nome do Titular */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.cardholderName ? 'text-red-500' : ''}`}>
          Nome do titular
        </Label>
        <div 
          className={`${inputContainerStyle} ${errors.cardholderName ? 'border-red-500 ring-red-500' : ''}`}
          style={{ backgroundColor, borderColor: errors.cardholderName ? undefined : borderColor }}
        >
          <User className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.cardholderName ? 'text-red-500' : 'text-gray-400'}`} />
          <Input
            value={cardholderName}
            onChange={(e) => {
              setCardholderName(e.target.value);
              clearError('cardholderName');
            }}
            placeholder="Como impresso no cartão"
            className="border-0 p-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
            style={{ color: textColor }}
          />
        </div>
        {errors.cardholderName && <span className="text-xs text-red-500 mt-0.5">{errors.cardholderName}</span>}
      </div>

      {/* CPF do Titular */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.identificationNumber ? 'text-red-500' : ''}`}>
          CPF do titular
        </Label>
        <div 
          className={`${inputContainerStyle} ${errors.identificationNumber ? 'border-red-500 ring-red-500' : ''}`}
          style={{ backgroundColor, borderColor: errors.identificationNumber ? undefined : borderColor }}
        >
          <ShieldCheck className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.identificationNumber ? 'text-red-500' : 'text-gray-400'}`} />
          <Input
            value={identificationNumber}
            onChange={(e) => {
              setIdentificationNumber(formatCPF(e.target.value));
              clearError('identificationNumber');
            }}
            placeholder="000.000.000-00"
            maxLength={14}
            className="border-0 p-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
            style={{ color: textColor }}
          />
        </div>
        {errors.identificationNumber && <span className="text-xs text-red-500 mt-0.5">{errors.identificationNumber}</span>}
      </div>

      {/* Parcelamento - Dropdown Custom (sem azul do SO) */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70" style={{ color: textColor }}>
          Parcelamento
          {installmentsSource === 'mercadopago' && (
            <span className="ml-1 text-green-500 text-[9px]">✓ MP</span>
          )}
        </Label>
        <InstallmentsDropdown
          installments={installments}
          selectedValue={selectedInstallment}
          onSelect={setSelectedInstallment}
          isLoading={isLoadingInstallments}
          textColor={textColor}
          backgroundColor={backgroundColor}
          borderColor={borderColor}
          disabled={isProcessing}
        />
      </div>

      {/* Erro geral */}
      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
          {errors.submit}
        </div>
      )}
    </div>
  );
};

// Manter export do resetSecureFieldsState para compatibilidade
export { resetSecureFieldsState } from './components';
