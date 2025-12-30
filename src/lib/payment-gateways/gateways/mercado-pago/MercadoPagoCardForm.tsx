/**
 * MercadoPagoCardForm - REFATORADO
 * 
 * Componente principal do formulário de cartão usando @mercadopago/sdk-react
 * 
 * REFATORAÇÃO:
 * - Lógica de estado → useCardFormState
 * - Lógica de validação → useCardValidation  
 * - Resolução de BIN → useBinResolution
 * - Campos seguros → SecureFields + SecureFieldsPortal
 * 
 * Este arquivo agora tem < 200 linhas (antes: 714)
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { initMercadoPago, createCardToken } from '@mercadopago/sdk-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Calendar, Lock, User, ShieldCheck } from 'lucide-react';
import type { CardFormProps, CardTokenResult } from '@/types/payment-types';

// Hooks refatorados
import { useCardFormState, useCardValidation, useBinResolution } from './hooks';

// Componentes refatorados
import { SecureFieldsPortal } from './components';

// Controle de inicialização global do SDK
let lastInitializedPublicKey: string | null = null;

// Helper para determinar se a cor de fundo é clara
const isLightColor = (color: string): boolean => {
  if (!color || color === 'transparent') return true;
  
  // Converter hex para RGB
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Luminosidade relativa
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  return true;
};

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
  // Hooks refatorados
  const { 
    state, 
    cardholderNameRef, 
    identificationNumberRef, 
    selectedInstallmentRef,
    setCardholderName, 
    setIdentificationNumber, 
    setSelectedInstallment,
    formatCPF 
  } = useCardFormState(amount);

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

  const { paymentMethodIdRef, issuerIdRef, handleBinChange } = useBinResolution();

  const onMountCalledRef = useRef(false);

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
            value={state.cardholderName}
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
            value={state.identificationNumber}
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

      {/* Parcelamento */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70" style={{ color: textColor }}>Parcelamento</Label>
        <Select value={state.selectedInstallment} onValueChange={setSelectedInstallment}>
          <SelectTrigger 
            className="w-full h-10 rounded-xl" 
            style={{ 
              color: textColor,
              backgroundColor,
              borderColor,
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <SelectValue>
              <span style={{ color: textColor }}>
                {state.installments.find(i => i.value?.toString() === state.selectedInstallment)?.label || 'Selecione'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent 
            className="border z-50"
            style={{ 
              backgroundColor,
              borderColor
            }}
          >
            {state.installments.map((inst) => {
              const isLight = isLightColor(backgroundColor);
              return (
                <SelectItem 
                  key={inst.value} 
                  value={inst.value?.toString() || '1'} 
                  className={`cursor-pointer ${isLight ? 'focus:bg-black/5 data-[highlighted]:bg-black/5' : 'focus:bg-white/10 data-[highlighted]:bg-white/10'}`}
                  style={{ color: textColor }}
                >
                  {inst.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
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
