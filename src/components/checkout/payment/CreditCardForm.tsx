/**
 * CreditCardForm - Formulário Universal de Cartão de Crédito
 * 
 * Componente wrapper que orquestra campos compartilhados e específicos do gateway.
 * Suporta múltiplos gateways de pagamento com máxima reutilização de código.
 * 
 * Arquitetura:
 * - 80% do código é compartilhado (CardHolderNameField, CPFField, InstallmentsField)
 * - 20% é específico do gateway (iframes/elements de número, validade, CVV)
 * 
 * Gateways Suportados:
 * - Mercado Pago ✅
 * - Stripe (planejado)
 * - PagSeguro (planejado)
 * - Outros (futuro)
 */

import { useState, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { toast } from 'sonner';
import { validateDocument, maskDocument } from '@/lib/validation';
import { syncMercadoPagoHiddenFields, updateMercadoPagoInstallmentsSelect } from '@/lib/payment-gateways/helpers';

// Campos compartilhados
import { CardHolderNameField, CPFField, InstallmentsField, SecurityBadge } from './fields/shared';

// Campos específicos dos gateways
import { MercadoPagoFields, type MercadoPagoFieldsRef } from './fields/gateways';

// Types
import type { PaymentGatewayId as PaymentGatewayType, Installment } from '@/types/payment-types';

// ============================================
// INTERFACES
// ============================================

export interface CreditCardFormProps {
  /** Gateway de pagamento a ser usado */
  gateway: PaymentGatewayType;
  
  /** Chave pública do gateway */
  publicKey: string;
  
  /** Valor da compra em centavos */
  amount: number;
  
  /** Email do pagador */
  payerEmail: string;
  
  /** Callback chamado ao submeter o formulário com sucesso */
  onSubmit: (tokenData: CardTokenData) => Promise<void>;
  
  /** Formulário está em estado de loading */
  loading?: boolean;
  
  /** Callback chamado quando houver erro */
  onError?: (error: string) => void;
}

export interface CardTokenData {
  token: string;
  installments: number;
  paymentMethodId?: string;
  issuerId?: string;
  cardholderName: string;
  cardholderDocument: string;
}

export interface CreditCardFormRef {
  /** Submete o formulário */
  submit: () => Promise<void>;
  
  /** Reseta o formulário */
  reset: () => void;
}

// ============================================
// COMPONENTE
// ============================================

const CreditCardFormComponent = forwardRef<CreditCardFormRef, CreditCardFormProps>(
  ({ gateway, publicKey, amount, payerEmail, onSubmit, loading = false, onError }, ref) => {
    
    // ========================================
    // STATE - Campos Compartilhados
    // ========================================
    const [cardholderName, setCardholderName] = useState('');
    const [cardholderDocument, setCardholderDocument] = useState('');
    const [selectedInstallments, setSelectedInstallments] = useState(1);
    const [installments, setInstallments] = useState<Installment[]>([]);
    
    // ========================================
    // STATE - Validação
    // ========================================
    const [errors, setErrors] = useState<{
      cardholderName?: string;
      cardholderDocument?: string;
      installments?: string;
    }>({});
    
    // ========================================
    // REFS - Gateway Fields
    // ========================================
    const mercadoPagoFieldsRef = useRef<MercadoPagoFieldsRef>(null);
    // Adicionar refs para outros gateways aqui:
    // const stripeFieldsRef = useRef<StripeFieldsRef>(null);
    
    const formContainerRef = useRef<HTMLDivElement>(null);
    
    // ========================================
    // HANDLERS - Campos Compartilhados
    // ========================================
    
    const handleCardholderNameChange = (value: string) => {
      setCardholderName(value);
      if (errors.cardholderName) {
        setErrors(prev => ({ ...prev, cardholderName: undefined }));
      }
    };
    
    const handleCardholderDocumentChange = (value: string) => {
      const masked = maskDocument(value);
      setCardholderDocument(masked);
      if (errors.cardholderDocument) {
        setErrors(prev => ({ ...prev, cardholderDocument: undefined }));
      }
    };
    
    const handleInstallmentsChange = (value: number) => {
      setSelectedInstallments(value);
      if (errors.installments) {
        setErrors(prev => ({ ...prev, installments: undefined }));
      }
    };
    
    const handleInstallmentsReceived = (data: any[]) => {
      // Converte formato do Mercado Pago para formato padrão
      const formattedInstallments: Installment[] = data.map(item => ({
        value: item.installments,
        installments: item.installments,
        installmentAmount: item.installment_amount,
        totalAmount: item.total_amount,
        hasInterest: item.installment_rate > 0,
        interestRate: item.installment_rate,
        label: '', // Será gerado pelo componente InstallmentsField
      }));
      
      setInstallments(formattedInstallments);
      
      // Atualiza select do SDK do Mercado Pago
      updateMercadoPagoInstallmentsSelect(data, selectedInstallments);
    };
    
    // ========================================
    // VALIDAÇÃO
    // ========================================
    
    const validateSharedFields = (): boolean => {
      const newErrors: typeof errors = {};
      
      if (!cardholderName.trim()) {
        newErrors.cardholderName = 'Nome é obrigatório';
      } else if (cardholderName.trim().length < 3) {
        newErrors.cardholderName = 'Nome deve ter no mínimo 3 caracteres';
      }
      
      if (!cardholderDocument.trim()) {
        newErrors.cardholderDocument = 'CPF/CNPJ é obrigatório';
      } else if (!validateDocument(cardholderDocument)) {
        newErrors.cardholderDocument = 'CPF/CNPJ inválido';
      }
      
      if (!selectedInstallments || selectedInstallments < 1) {
        newErrors.installments = 'Selecione o parcelamento';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    // ========================================
    // SUBMIT
    // ========================================
    
    const handleSubmit = async () => {
      // 1. Valida campos compartilhados
      const sharedFieldsValid = validateSharedFields();
      
      if (!sharedFieldsValid) {
        toast.error('Verifique os campos destacados');
        if (formContainerRef.current) {
          formContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      
      // 2. Sincroniza campos com SDK do Mercado Pago
      if (gateway === 'mercadopago') {
        syncMercadoPagoHiddenFields({
          cardholderName,
          cardholderDocument,
          installments: selectedInstallments,
        });
      }
      
      // 3. Cria token do cartão via gateway
      let tokenData: CardTokenData;
      
      try {
        if (gateway === 'mercadopago') {
          if (!mercadoPagoFieldsRef.current) {
            throw new Error('Gateway não inicializado');
          }
          
          const mpToken = await mercadoPagoFieldsRef.current.createToken();
          
          tokenData = {
            token: mpToken.token,
            installments: selectedInstallments,
            paymentMethodId: mpToken.paymentMethodId,
            issuerId: mpToken.issuerId,
            cardholderName,
            cardholderDocument: cardholderDocument.replace(/\D/g, ''),
          };
        } else {
          // Adicionar lógica para outros gateways aqui
          throw new Error(`Gateway ${gateway} não implementado`);
        }
      } catch (error: unknown) {
        console.error('[CreditCardForm] Erro ao criar token:', error);
        toast.error('Verifique os dados do cartão');
        if (formContainerRef.current) {
          formContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        throw error;
      }
      
      // 4. Chama callback de submit
      await onSubmit(tokenData);
    };
    
    const reset = () => {
      setCardholderName('');
      setCardholderDocument('');
      setSelectedInstallments(1);
      setInstallments([]);
      setErrors({});
    };
    
    // ========================================
    // REF METHODS
    // ========================================
    
    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      reset,
    }));
    
    // ========================================
    // RENDER
    // ========================================
    
    return (
      <div className="w-full relative" ref={formContainerRef}>
        <form id="form-checkout" className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          
          {/* ====================================== */}
          {/* CAMPOS ESPECÍFICOS DO GATEWAY */}
          {/* ====================================== */}
          
          {gateway === 'mercadopago' && (
            <MercadoPagoFields
              ref={mercadoPagoFieldsRef}
              publicKey={publicKey}
              amount={amount}
              payerEmail={payerEmail}
              onReady={() => console.log('[CreditCardForm] Mercado Pago pronto')}
              onError={onError}
              onInstallmentsChange={handleInstallmentsReceived}
            />
          )}
          
          {/* Adicionar outros gateways aqui:
          {gateway === 'stripe' && (
            <StripeFields
              ref={stripeFieldsRef}
              publicKey={publicKey}
              amount={amount}
              onReady={() => console.log('[CreditCardForm] Stripe pronto')}
              onError={onError}
            />
          )}
          */}
          
          {/* ====================================== */}
          {/* CAMPOS COMPARTILHADOS */}
          {/* ====================================== */}
          
          <CardHolderNameField
            value={cardholderName}
            error={errors.cardholderName}
            disabled={loading}
            onChange={handleCardholderNameChange}
          />
          
          <CPFField
            value={cardholderDocument}
            error={errors.cardholderDocument}
            disabled={loading}
            onChange={handleCardholderDocumentChange}
          />
          
          <InstallmentsField
            installments={installments}
            value={selectedInstallments}
            error={errors.installments}
            disabled={loading}
            onChange={handleInstallmentsChange}
          />
          
          {/* ====================================== */}
          {/* SELO DE SEGURANÇA */}
          {/* ====================================== */}
          
          <SecurityBadge />
          
        </form>
      </div>
    );
  }
);

CreditCardFormComponent.displayName = 'CreditCardForm';

export const CreditCardForm = memo(CreditCardFormComponent);
