/**
 * MercadoPagoCardForm
 * 
 * Formulário de cartão usando @mercadopago/sdk-react
 * 
 * ✅ Componentes React nativos - sem conflitos de ciclo de vida
 * ✅ PCI DSS SAQ A Compliance garantido
 * ✅ Campos sensíveis em iframes seguros
 * ✅ Parcelas exibidas imediatamente (sem esperar BIN)
 * ✅ SecureFields MEMOIZADO - NUNCA re-renderiza com estado local
 * ✅ Fallback de erros para campos vazios do MP
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { initMercadoPago, CardNumber, ExpirationDate, SecurityCode, createCardToken, getPaymentMethods, getIssuers } from '@mercadopago/sdk-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Calendar, Lock, User, ShieldCheck } from 'lucide-react';
import { generateInstallments } from '../../installments';
import type { CardFormProps, CardTokenResult, Installment } from '@/types/payment-types';

// Controle de inicialização global do SDK
let lastInitializedPublicKey: string | null = null;

// Estilos compartilhados
const inputContainerStyle = "relative flex h-10 w-full items-center rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";

// ============================================================================
// SecureFields - Componente COMPLETAMENTE MEMOIZADO
// NUNCA re-renderiza quando o pai muda estado (Nome, CPF, etc)
// Erros são exibidos FORA deste componente
// ============================================================================
interface SecureFieldsProps {
  onReady: () => void;
  textColor: string;
  placeholderColor: string;
  // Callbacks para limpar erros quando usuário interage com campos MP
  onCardNumberChange?: () => void;
  onExpirationDateChange?: () => void;
  onSecurityCodeChange?: () => void;
  // Callback para capturar BIN e resolver paymentMethodId/issuerId
  onBinChange?: (bin: string) => void;
}

const SecureFields = memo(({ 
  onReady, 
  textColor, 
  placeholderColor,
  onCardNumberChange,
  onExpirationDateChange,
  onSecurityCodeChange,
  onBinChange
}: SecureFieldsProps) => {
  const readyCalledRef = useRef(false);
  const [isCardNumberReady, setIsCardNumberReady] = useState(false);
  const [isExpirationReady, setIsExpirationReady] = useState(false);
  const [isSecurityCodeReady, setIsSecurityCodeReady] = useState(false);

  const handleCardNumberReady = useCallback(() => {
    setIsCardNumberReady(true);
    if (!readyCalledRef.current) {
      readyCalledRef.current = true;
      console.log('[SecureFields] CardNumber ready - iframes carregados');
      onReady();
    }
  }, [onReady]);

  const handleExpirationReady = useCallback(() => {
    setIsExpirationReady(true);
  }, []);

  const handleSecurityCodeReady = useCallback(() => {
    setIsSecurityCodeReady(true);
  }, []);

  // Estilo para os iframes do MP
  const secureFieldStyle = {
    height: '100%',
    padding: '0',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: textColor,
    '::placeholder': {
      color: placeholderColor,
    }
  };

  console.log('[SecureFields] Montando componente (deve acontecer apenas 1x)');

  return (
    <>
      {/* Número do Cartão - Container com placeholder instantâneo */}
      <div className="mp-field-card-number">
        <div className="mp-secure-field-container relative">
          {/* Placeholder visual instantâneo - desaparece quando iframe carrega */}
          {!isCardNumberReady && (
            <div 
              className="absolute inset-0 flex items-center pointer-events-none z-10"
              style={{ color: placeholderColor }}
            >
              <span className="text-sm">0000 0000 0000 0000</span>
            </div>
          )}
          <CardNumber
            placeholder="0000 0000 0000 0000"
            style={secureFieldStyle}
            onReady={handleCardNumberReady}
            onChange={() => onCardNumberChange?.()}
            onBinChange={(data) => {
              if (data?.bin) {
                console.log('[SecureFields] BIN detectado:', data.bin);
                onBinChange?.(data.bin);
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Validade - Container com placeholder instantâneo */}
        <div className="mp-field-expiration">
          <div className="mp-secure-field-container relative">
            {!isExpirationReady && (
              <div 
                className="absolute inset-0 flex items-center pointer-events-none z-10"
                style={{ color: placeholderColor }}
              >
                <span className="text-sm">MM/AA</span>
              </div>
            )}
            <ExpirationDate
              placeholder="MM/AA"
              style={secureFieldStyle}
              onReady={handleExpirationReady}
              onChange={() => onExpirationDateChange?.()}
            />
          </div>
        </div>

        {/* CVV - Container com placeholder instantâneo */}
        <div className="mp-field-security-code">
          <div className="mp-secure-field-container relative">
            {!isSecurityCodeReady && (
              <div 
                className="absolute inset-0 flex items-center pointer-events-none z-10"
                style={{ color: placeholderColor }}
              >
                <span className="text-sm">123</span>
              </div>
            )}
            <SecurityCode
              placeholder="123"
              style={secureFieldStyle}
              onReady={handleSecurityCodeReady}
              onChange={() => onSecurityCodeChange?.()}
            />
          </div>
        </div>
      </div>
    </>
  );
}, () => true); // Comparador que SEMPRE retorna true = NUNCA re-renderiza

SecureFields.displayName = 'SecureFields';

// ============================================================================
// MercadoPagoCardForm - Componente Principal
// ============================================================================
export const MercadoPagoCardForm: React.FC<CardFormProps & { textColor?: string, placeholderColor?: string }> = ({
  publicKey,
  amount,
  onSubmit,
  onError,
  onReady,
  onMount,
  isProcessing = false,
  textColor = '#ffffff',
  placeholderColor = '#9ca3af'
}) => {
  // Estados do formulário local (Nome, CPF, Parcelas)
  const [cardholderName, setCardholderName] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState('1');
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Estados de validação
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  // Refs para valores atuais (usados no submit sem causar re-render)
  const cardholderNameRef = useRef('');
  const identificationNumberRef = useRef('');
  const selectedInstallmentRef = useRef('1');
  const onMountCalledRef = useRef(false);
  
  // Refs para paymentMethodId e issuerId (resolvidos via BIN)
  const paymentMethodIdRef = useRef<string>('');
  const issuerIdRef = useRef<string>('');
  const lastBinRef = useRef<string>('');

  // Manter refs sincronizadas
  useEffect(() => { cardholderNameRef.current = cardholderName; }, [cardholderName]);
  useEffect(() => { identificationNumberRef.current = identificationNumber; }, [identificationNumber]);
  useEffect(() => { selectedInstallmentRef.current = selectedInstallment; }, [selectedInstallment]);
  
  // Callback para resolver paymentMethodId e issuerId a partir do BIN
  const handleBinChange = useCallback(async (bin: string) => {
    // Evitar chamadas duplicadas para o mesmo BIN
    if (!bin || bin.length < 6 || bin === lastBinRef.current) return;
    lastBinRef.current = bin;
    
    console.log('[MercadoPagoCardForm] Resolvendo paymentMethodId para BIN:', bin);
    
    try {
      // Chamar getPaymentMethods para identificar a bandeira
      const paymentMethods = await getPaymentMethods({ bin });
      console.log('[MercadoPagoCardForm] PaymentMethods response:', paymentMethods);
      
      if (paymentMethods?.results && paymentMethods.results.length > 0) {
        const method = paymentMethods.results[0];
        paymentMethodIdRef.current = method.id || '';
        console.log('[MercadoPagoCardForm] ✅ PaymentMethodId resolvido:', paymentMethodIdRef.current);
        
        // Tentar resolver o issuer
        if (method.issuer?.id) {
          issuerIdRef.current = method.issuer.id.toString();
          console.log('[MercadoPagoCardForm] ✅ IssuerId (do paymentMethod):', issuerIdRef.current);
        } else {
          // Chamar getIssuers se necessário
          try {
            const issuers = await getIssuers({ bin, paymentMethodId: method.id });
            console.log('[MercadoPagoCardForm] Issuers response:', issuers);
            
            if (issuers && issuers.length > 0) {
              issuerIdRef.current = issuers[0].id?.toString() || '';
              console.log('[MercadoPagoCardForm] ✅ IssuerId (de getIssuers):', issuerIdRef.current);
            }
          } catch (issuerError) {
            console.log('[MercadoPagoCardForm] Issuers não disponível (normal para algumas bandeiras):', issuerError);
          }
        }
      } else {
        console.warn('[MercadoPagoCardForm] ⚠️ Nenhum paymentMethod encontrado para BIN:', bin);
      }
    } catch (error) {
      console.error('[MercadoPagoCardForm] Erro ao resolver paymentMethodId:', error);
    }
  }, []);

  // ========== FUNÇÃO PARA LIMPAR ERRO DE CAMPO ESPECÍFICO ==========
  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      if (!prev[fieldName]) return prev; // Não modificar se não há erro
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  // Callbacks estáveis para limpar erros dos campos MP
  const clearCardNumberError = useCallback(() => clearError('cardNumber'), [clearError]);
  const clearExpirationDateError = useCallback(() => clearError('expirationDate'), [clearError]);
  const clearSecurityCodeError = useCallback(() => clearError('securityCode'), [clearError]);

  // Inicializar SDK (reinicializa se Public Key mudar)
  useEffect(() => {
    if (publicKey && publicKey !== lastInitializedPublicKey) {
      try {
        console.log('[MercadoPagoCardForm] Inicializando SDK com publicKey:', publicKey.substring(0, 20) + '...');
        initMercadoPago(publicKey, { locale: 'pt-BR' });
        lastInitializedPublicKey = publicKey;
        console.log('[MercadoPagoCardForm] SDK inicializado com sucesso');
      } catch (e) {
        console.log('[MercadoPagoCardForm] Erro ao inicializar SDK:', e);
        // Tentar reinicializar mesmo assim
        lastInitializedPublicKey = publicKey;
      }
    }
  }, [publicKey]);

  // Gerar parcelas imediatamente
  useEffect(() => {
    if (amount > 0) {
      const generatedInstallments = generateInstallments(amount);
      setInstallments(generatedInstallments);
      console.log('[MercadoPagoCardForm] Parcelas geradas:', generatedInstallments.length);
    }
  }, [amount]);

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Callback quando SecureFields estão prontos
  const handleSecureFieldsReady = useCallback(() => {
    onReady?.();
  }, [onReady]);

  // Função de submit
  const handleSubmit = useCallback(async () => {
    console.log('[MercadoPagoCardForm] Submit chamado');
    setHasAttemptedSubmit(true);
    
    const currentName = cardholderNameRef.current;
    const currentCPF = identificationNumberRef.current;
    const currentInstallment = selectedInstallmentRef.current;
    
    // DEBUG: Ver valores capturados
    console.log('[DEBUG] Nome:', currentName);
    console.log('[DEBUG] CPF bruto:', currentCPF);
    console.log('[DEBUG] CPF sem formatação:', currentCPF.replace(/\D/g, ''));
    console.log('[DEBUG] Tamanho CPF:', currentCPF.replace(/\D/g, '').length);
    console.log('[DEBUG] Parcelas:', currentInstallment);
    
    // Validação dos campos locais
    const localErrors: Record<string, string> = {};

    if (!currentName.trim()) {
      localErrors.cardholderName = 'Obrigatório';
    }

    if (!currentCPF.trim()) {
      localErrors.identificationNumber = 'Obrigatório';
    } else if (currentCPF.replace(/\D/g, '').length !== 11) {
      localErrors.identificationNumber = 'CPF inválido';
    }

    try {
      // Criar token usando SDK React
      const token = await createCardToken({
        cardholderName: currentName.toUpperCase() || 'NOME OBRIGATORIO', // Força valor para SDK validar
        identificationType: 'CPF',
        identificationNumber: currentCPF.replace(/\D/g, '') || '00000000000',
      });

      // Se chegou aqui, o cartão está válido
      if (Object.keys(localErrors).length > 0) {
        setErrors(localErrors);
        console.log('[MercadoPagoCardForm] Erros locais:', localErrors);
        return;
      }

      if (token && token.id) {
        console.log('[MercadoPagoCardForm] Token criado:', token.id);
        
        // Usar refs que foram resolvidas via BIN (fonte confiável)
        // Fallback para dados do token apenas se refs estiverem vazias
        const tokenAny = token as any;
        const resolvedPaymentMethodId = paymentMethodIdRef.current || tokenAny.payment_method?.id || tokenAny.paymentMethodId || '';
        const resolvedIssuerId = issuerIdRef.current || tokenAny.issuer?.id?.toString() || tokenAny.issuerId?.toString() || '';
        
        console.log('[MercadoPagoCardForm] ✅ Dados finais para submit:', {
          paymentMethodId: resolvedPaymentMethodId,
          issuerId: resolvedIssuerId,
          fonte: paymentMethodIdRef.current ? 'BIN resolution' : 'token fallback'
        });
        
        // Validar se temos paymentMethodId
        if (!resolvedPaymentMethodId) {
          console.error('[MercadoPagoCardForm] ❌ paymentMethodId não foi resolvido!');
          setErrors({ cardNumber: 'Não foi possível identificar a bandeira do cartão. Verifique o número.' });
          return;
        }
        
        const result: CardTokenResult = {
          token: token.id,
          paymentMethodId: resolvedPaymentMethodId,
          issuerId: resolvedIssuerId,
          installments: parseInt(currentInstallment, 10),
        };

        onSubmit(result);
      } else {
        throw new Error('Token não foi gerado');
      }
    } catch (error: any) {
      console.error('[MercadoPagoCardForm] Erro ao criar token:', error);
      
      const mpErrors: Record<string, string> = {};
      
      // Tratar erros do SDK
      if (error.cause) {
        const causes = Array.isArray(error.cause) ? error.cause : [error.cause];
        
        causes.forEach((c: any) => {
           const field = c.field;
           const code = c.code;
           
           console.log(`[MercadoPagoCardForm] Erro - Field: ${field}, Code: ${code}`);

           if (field === 'cardNumber' || ["205", "E301"].includes(code)) {
             mpErrors.cardNumber = "Obrigatório";
           }
           
           if (field === 'expirationMonth' || field === 'expirationYear' || ["208", "209", "325", "326"].includes(code)) {
             mpErrors.expirationDate = "Obrigatório";
           }
           
           if (field === 'securityCode' || ["224", "E302"].includes(code)) {
             mpErrors.securityCode = "Obrigatório";
           }
           
           if (["221", "316"].includes(code)) localErrors.cardholderName = "Nome inválido";
           if (["214", "324"].includes(code)) localErrors.identificationNumber = "CPF inválido";
        });
      }

      // FALLBACK CRÍTICO: Se o SDK não retornou erros específicos mas falhou,
      // assume que os campos do MP estão vazios
      if (Object.keys(mpErrors).length === 0 && error) {
        console.log('[MercadoPagoCardForm] Aplicando fallback de erros para campos vazios');
        mpErrors.cardNumber = "Obrigatório";
        mpErrors.expirationDate = "Obrigatório";
        mpErrors.securityCode = "Obrigatório";
      }

      // Combinar erros
      const allErrors = { ...localErrors, ...mpErrors };
      console.log('[MercadoPagoCardForm] Todos os erros:', allErrors);
      setErrors(allErrors);
      
      if (mpErrors.submit) {
        onError?.(new Error(mpErrors.submit));
      }
    }
  }, [onSubmit, onError]);

  // Expor função de submit via onMount - APENAS UMA VEZ
  useEffect(() => {
    if (onMount && !onMountCalledRef.current) {
      onMountCalledRef.current = true;
      onMount(handleSubmit);
    }
  }, [onMount, handleSubmit]);

  return (
    <div className="space-y-4">
      {/* ========== CAMPO: Número do Cartão ========== */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.cardNumber ? 'text-red-500' : ''}`}>
          Número do cartão
        </Label>
        <div className={`${inputContainerStyle} ${errors.cardNumber ? 'border-red-500 ring-red-500' : ''}`}>
          <CreditCard className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.cardNumber ? 'text-red-500' : 'text-gray-400'}`} />
          {/* O iframe real está dentro do SecureFields memoizado */}
          <div id="mp-card-number-slot" className="flex-1 h-full" />
        </div>
        {errors.cardNumber && <span className="text-xs text-red-500 mt-0.5">{errors.cardNumber}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* ========== CAMPO: Validade ========== */}
        <div className="space-y-1">
          <Label className={`text-[11px] font-normal opacity-70 ${errors.expirationDate ? 'text-red-500' : ''}`}>
            Validade
          </Label>
          <div className={`${inputContainerStyle} ${errors.expirationDate ? 'border-red-500 ring-red-500' : ''}`}>
            <Calendar className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.expirationDate ? 'text-red-500' : 'text-gray-400'}`} />
            <div id="mp-expiration-slot" className="flex-1 h-full" />
          </div>
          {errors.expirationDate && <span className="text-xs text-red-500 mt-0.5">{errors.expirationDate}</span>}
        </div>

        {/* ========== CAMPO: CVV ========== */}
        <div className="space-y-1">
          <Label className={`text-[11px] font-normal opacity-70 ${errors.securityCode ? 'text-red-500' : ''}`}>
            CVV
          </Label>
          <div className={`${inputContainerStyle} ${errors.securityCode ? 'border-red-500 ring-red-500' : ''}`}>
            <Lock className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.securityCode ? 'text-red-500' : 'text-gray-400'}`} />
            <div id="mp-security-slot" className="flex-1 h-full" />
          </div>
          {errors.securityCode && <span className="text-xs text-red-500 mt-0.5">{errors.securityCode}</span>}
        </div>
      </div>

      {/* SecureFields MEMOIZADO - Renderiza os iframes MP via Portal */}
      <SecureFieldsPortal 
        onReady={handleSecureFieldsReady}
        textColor={textColor}
        placeholderColor={placeholderColor}
        onCardNumberChange={clearCardNumberError}
        onExpirationDateChange={clearExpirationDateError}
        onSecurityCodeChange={clearSecurityCodeError}
        onBinChange={handleBinChange}
      />

      {/* ========== CAMPO: Nome do Titular ========== */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.cardholderName ? 'text-red-500' : ''}`}>
          Nome do titular
        </Label>
        <div className={`${inputContainerStyle} ${errors.cardholderName ? 'border-red-500 ring-red-500' : ''}`}>
          <User className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.cardholderName ? 'text-red-500' : 'text-gray-400'}`} />
          <Input
            value={cardholderName}
            onChange={(e) => {
              setCardholderName(e.target.value);
              clearError('cardholderName'); // Limpa erro ao digitar
            }}
            placeholder="Como impresso no cartão"
            className="border-0 p-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
            style={{ color: textColor }}
          />
        </div>
        {errors.cardholderName && <span className="text-xs text-red-500 mt-0.5">{errors.cardholderName}</span>}
      </div>

      {/* ========== CAMPO: CPF do Titular ========== */}
      <div className="space-y-1">
        <Label className={`text-[11px] font-normal opacity-70 ${errors.identificationNumber ? 'text-red-500' : ''}`}>
          CPF do titular
        </Label>
        <div className={`${inputContainerStyle} ${errors.identificationNumber ? 'border-red-500 ring-red-500' : ''}`}>
          <ShieldCheck className={`mr-2 h-4 w-4 flex-shrink-0 ${errors.identificationNumber ? 'text-red-500' : 'text-gray-400'}`} />
          <Input
            value={identificationNumber}
            onChange={(e) => {
              setIdentificationNumber(formatCPF(e.target.value));
              clearError('identificationNumber'); // Limpa erro ao digitar
            }}
            placeholder="000.000.000-00"
            maxLength={14}
            className="border-0 p-0 h-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-muted-foreground"
            style={{ color: textColor }}
          />
        </div>
        {errors.identificationNumber && <span className="text-xs text-red-500 mt-0.5">{errors.identificationNumber}</span>}
      </div>

      {/* ========== CAMPO: Parcelamento ========== */}
      <div className="space-y-1">
        <Label className="text-[11px] font-normal opacity-70" style={{ color: textColor }}>Parcelamento</Label>
        <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
          <SelectTrigger 
            className="w-full h-10 rounded-xl border border-input bg-transparent"
            style={{ color: textColor }}
          >
            <SelectValue>
              <span style={{ color: textColor }}>
                {installments.find(i => i.value?.toString() === selectedInstallment)?.label || 'Selecione o parcelamento'}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {installments.map((inst) => (
              <SelectItem key={inst.value} value={inst.value?.toString() || '1'} className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                {inst.label}
              </SelectItem>
            ))}
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

// ============================================================================
// SecureFieldsPortal - Renderiza SecureFields e move iframes para os slots
// Usa MutationObserver para detectar quando iframes são criados pelo SDK
// GARANTIA DE MONTAGEM ÚNICA com reset automático quando sai do checkout
// ============================================================================

// Flag GLOBAL para controle de montagem
const secureFieldsGlobalState = {
  mounted: false,
  containerElement: null as HTMLDivElement | null,
  currentPath: null as string | null,
};

// Função para resetar o estado global (chamada quando sai da página de checkout)
export const resetSecureFieldsState = () => {
  console.log('[SecureFieldsPortal] Resetando estado global');
  secureFieldsGlobalState.mounted = false;
  secureFieldsGlobalState.containerElement = null;
  secureFieldsGlobalState.currentPath = null;
};

const SecureFieldsPortal: React.FC<SecureFieldsProps> = memo((props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const isThisInstanceOwner = useRef(false);

  useEffect(() => {
    // Detectar mudança de página
    const currentPath = window.location.pathname;
    
    // Se a página mudou (navegou para PIX, success, etc), resetar o estado
    if (secureFieldsGlobalState.currentPath && 
        secureFieldsGlobalState.currentPath !== currentPath &&
        !currentPath.includes('/pay/')) {
      console.log('[SecureFieldsPortal] Página mudou, resetando estado');
      resetSecureFieldsState();
    }
    
    secureFieldsGlobalState.currentPath = currentPath;

    // Se já existe uma instância montada, não fazer nada
    if (secureFieldsGlobalState.mounted && !isThisInstanceOwner.current) {
      console.log('[SecureFieldsPortal] Já existe instância global, reutilizando');
      
      // Mover os iframes existentes para os slots desta instância
      requestAnimationFrame(() => {
        const existingContainer = secureFieldsGlobalState.containerElement;
        if (existingContainer) {
          const cardNumberEl = existingContainer.querySelector('.mp-field-card-number .mp-secure-field-container');
          const expirationEl = existingContainer.querySelector('.mp-field-expiration .mp-secure-field-container');
          const securityEl = existingContainer.querySelector('.mp-field-security-code .mp-secure-field-container');

          const cardSlot = document.getElementById('mp-card-number-slot');
          const expSlot = document.getElementById('mp-expiration-slot');
          const secSlot = document.getElementById('mp-security-slot');

          if (cardNumberEl && cardSlot) cardSlot.appendChild(cardNumberEl);
          if (expirationEl && expSlot) expSlot.appendChild(expirationEl);
          if (securityEl && secSlot) secSlot.appendChild(securityEl);
        }
      });
      return;
    }

    // Esta instância será a dona global
    secureFieldsGlobalState.mounted = true;
    isThisInstanceOwner.current = true;

    const moveIframes = () => {
      if (movedRef.current) return;
      
      const container = containerRef.current;
      if (!container) return;

      // Salvar referência do container globalmente
      secureFieldsGlobalState.containerElement = container;

      const cardNumberEl = container.querySelector('.mp-field-card-number .mp-secure-field-container');
      const expirationEl = container.querySelector('.mp-field-expiration .mp-secure-field-container');
      const securityEl = container.querySelector('.mp-field-security-code .mp-secure-field-container');

      const cardSlot = document.getElementById('mp-card-number-slot');
      const expSlot = document.getElementById('mp-expiration-slot');
      const secSlot = document.getElementById('mp-security-slot');

      if (cardNumberEl && cardSlot && !cardSlot.hasChildNodes()) {
        cardSlot.appendChild(cardNumberEl);
      }
      if (expirationEl && expSlot && !expSlot.hasChildNodes()) {
        expSlot.appendChild(expirationEl);
      }
      if (securityEl && secSlot && !secSlot.hasChildNodes()) {
        secSlot.appendChild(securityEl);
      }

      if (cardSlot?.hasChildNodes() && expSlot?.hasChildNodes() && secSlot?.hasChildNodes()) {
        movedRef.current = true;
        console.log('[SecureFieldsPortal] Iframes movidos para os slots');
      }
    };

    // Usar MutationObserver para detectar quando iframes são criados
    const observer = new MutationObserver(() => {
      if (!movedRef.current) {
        moveIframes();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true 
      });
    }

    // Tentar mover uma vez no próximo frame
    requestAnimationFrame(moveIframes);

    return () => {
      observer.disconnect();
      // Resetar estado quando componente desmontar (navegar para outra página)
      if (isThisInstanceOwner.current) {
        console.log('[SecureFieldsPortal] Componente desmontando, resetando estado');
        resetSecureFieldsState();
        isThisInstanceOwner.current = false;
        movedRef.current = false;
      }
    };
  }, []);

  // Se já existe instância e não somos os donos, não renderizar SecureFields
  if (secureFieldsGlobalState.mounted && !isThisInstanceOwner.current) {
    return <div ref={containerRef} className="hidden" />;
  }

  return (
    <div ref={containerRef} className="hidden">
      <SecureFields {...props} />
    </div>
  );
}, () => true);

SecureFieldsPortal.displayName = 'SecureFieldsPortal';
