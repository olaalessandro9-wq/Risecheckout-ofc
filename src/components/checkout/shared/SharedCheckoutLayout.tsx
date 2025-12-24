/**
 * SharedCheckoutLayout
 * 
 * Componente compartilhado que contém TODA a estrutura de layout do checkout
 * Usado por: Builder, Preview e Checkout Público
 * 
 * ✅ Single Source of Truth para estrutura e ordem dos elementos
 * ✅ Alterar layout: 1 arquivo ao invés de 3
 * ✅ Adicionar seção: 1 arquivo ao invés de 3
 * ✅ Texto do PIX hardcoded: Aparece em TODOS os modos
 * 
 * 🔧 REFATORAÇÃO (08/12/2025):
 * - Layout alterado de 2 colunas para 1 coluna única
 * - Todos os elementos agora aparecem em sequência vertical
 * - Consistente em todos os dispositivos (mobile e desktop)
 * - TUDO dentro de um único container principal (sem múltiplos cards)
 */

import React from 'react';
import { CheckCircle, Wallet, Zap } from 'lucide-react';
import {
  SharedProductSection,
  SharedPersonalDataForm,
  SharedPaymentMethodSelector,
  SharedOrderBumps,
  SharedOrderSummary,
  SharedCheckoutButton,
} from './index';

interface SharedCheckoutLayoutProps {
  // Dados
  productData: any;
  orderBumps: any[];
  design: any;
  
  // Estado de pagamento
  selectedPayment: 'pix' | 'credit_card';
  onPaymentChange: (payment: 'pix' | 'credit_card') => void;
  
  // Estado de bumps
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
  
  // Modo de operação
  mode: 'editor' | 'preview' | 'public';
  
  // Props específicas do modo público
  formData?: any;
  formErrors?: any;
  onFieldChange?: (field: string, value: string) => void;
  requiredFields?: any;
  isProcessing?: boolean;
  
  // Props para integração real (Custom Form)
  publicKey?: string | null;
  creditCardGateway?: string; // 'mercadopago' | 'stripe'
  amount?: number; // em centavos
  onSubmitPayment?: (token: string, installments: number, paymentMethodId: string, issuerId: string) => Promise<void>;
  
  // NOVO: Callback para quando o total/cupom muda
  onTotalChange?: (total: number, appliedCoupon: any) => void;
  
  // Componentes adicionais (opcional)
  additionalContent?: React.ReactNode;
  
  // Wrapper para formulário (usado no público)
  // Agora recebe formRef para permitir submit programático do PIX
  formWrapper?: (children: React.ReactNode, formRef: React.RefObject<HTMLFormElement>) => React.ReactNode;
}

export const SharedCheckoutLayout: React.FC<SharedCheckoutLayoutProps> = ({
  productData,
  orderBumps,
  design,
  selectedPayment,
  onPaymentChange,
  selectedBumps,
  onToggleBump,
  mode,
  formData,
  formErrors,
  onFieldChange,
  requiredFields,
  isProcessing,
  publicKey,
  creditCardGateway,
  amount,
  onSubmitPayment,
  onTotalChange,
  additionalContent,
  formWrapper,
}) => {
  // Permitir interação em todos os modos (editor, preview, público)
  const disabled = false;

  // Função para calcular se precisa de borda baseado no contraste
  const needsBorder = () => {
    const bgColor = design.colors.background || '#000000';
    const formBgColor = design.colors.formBackground || '#FFFFFF';
    
    // Converter hex para RGB e calcular luminosidade
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };
    
    const bgLuminance = getLuminance(bgColor);
    const formLuminance = getLuminance(formBgColor);
    
    // Se a diferença de luminosidade for pequena, precisa de borda
    const contrast = Math.abs(bgLuminance - formLuminance);
    return contrast < 0.3; // Threshold para baixo contraste
  };

  // Calcular estilo da borda dinamicamente
  const borderStyle = needsBorder() 
    ? '1px solid rgba(0, 0, 0, 0.1)' 
    : 'none';

  // Divisor Minimalista
  // Usando uma cor que funciona tanto no claro quanto no escuro
  // border-gray-200 para claro, border-white/10 para escuro
  // Como não temos classes dark mode aqui, vamos usar uma cor com opacidade que funcione em ambos
  const Divider = () => (
    <hr 
      className="border-t my-6" 
      style={{ 
        borderColor: design.colors.primaryText === '#FFFFFF' 
          ? 'rgba(255, 255, 255, 0.1)' // Tema escuro
          : 'rgba(0, 0, 0, 0.06)'      // Tema claro
      }} 
    />
  );

  // Conteúdo unificado em um único container
  // Estado para armazenar a função de submit do cartão
  const [cardSubmitFn, setCardSubmitFn] = React.useState<(() => void) | null>(null);
  
  // Ref para o formulário para poder disparar submit programaticamente
  const formRef = React.useRef<HTMLFormElement | null>(null);

  // MEMOIZADO: evitar que nova referência seja criada em cada render
  const handleCardSubmitReady = React.useCallback((fn: () => void) => {
    setCardSubmitFn(() => fn);
  }, []);

  const handleCheckoutClick = React.useCallback(() => {
    if (selectedPayment === 'credit_card' && cardSubmitFn) {
      // Cartão: dispara a função de submit do CustomCardForm
      cardSubmitFn();
    } else if (selectedPayment === 'pix') {
      // PIX: dispara o submit do formulário programaticamente
      // O formWrapper envolve o conteúdo em um <form>, precisamos disparar o submit
      if (formRef.current) {
        formRef.current.requestSubmit();
      } else {
        // Fallback: buscar o form mais próximo e disparar submit
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
    }
  }, [selectedPayment, cardSubmitFn]);

  const content = (
    <div 
      className="rounded-xl shadow-sm p-6 space-y-6"
      style={{ 
        backgroundColor: design.colors.formBackground || '#FFFFFF',
        border: borderStyle
      }}
    >
      {/* Produto */}
      {productData && (
        <>
          <SharedProductSection
            productData={productData}
            design={design}
            mode={mode}
          />
          <Divider />
        </>
      )}
      
      {/* Formulário de Dados Pessoais */}
      <SharedPersonalDataForm
          design={design}
          mode={mode}
          disabled={disabled}
          formData={formData}
          formErrors={formErrors}
          onFieldChange={onFieldChange}
          requiredFields={requiredFields}
        />

      <Divider />

      {/* Seção de Pagamento */}
      <div>
        <h2 
          className="text-lg font-semibold mb-4 flex items-center gap-2"
          style={{ color: design.colors.primaryText }}
        >
          <Wallet className="w-5 h-5" /> Pagamento
        </h2>
        
        {/* Bloco visual dedicado para os métodos de pagamento */}
        {/* RESTAURADO: Removido o background e borda forte que o usuário não gostou */}
        {/* Mantendo apenas o espaçamento vertical */}
        <div className="space-y-4">
          <SharedPaymentMethodSelector
              selectedPayment={selectedPayment}
              onPaymentChange={onPaymentChange}
              design={design}
              mode={mode}
              disabled={disabled}
              publicKey={publicKey}
              creditCardGateway={creditCardGateway}
              amount={amount}
              onSubmitPayment={onSubmitPayment}
              isProcessing={isProcessing}
              onCardSubmitReady={handleCardSubmitReady}
            />

          {/* Mensagem PIX - Aparece só quando PIX está selecionado */}
          {/* RESTAURADO: Estilo visual mais limpo e elegante, com barra lateral colorida */}
          {selectedPayment === 'pix' && (
            <div 
              className="p-4 rounded-r-lg flex items-start gap-3 relative overflow-hidden"
              style={{
                backgroundColor: design.colors.primaryText === '#FFFFFF' 
                  ? 'rgba(16, 185, 129, 0.1)' // Dark mode: verde bem suave
                  : '#EAFBF4',                // Light mode: verde menta bem claro (estilo Cakto/Kiwify)
              }}
            >
              {/* Barra lateral colorida - Efeito visual elegante */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: design.colors.active }}
              />

              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: design.colors.active }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: design.colors.primaryText }}>
                  Liberação imediata
                </p>
                <p className="text-sm mt-1" style={{ color: design.colors.secondaryText }}>
                  É simples, só usar o aplicativo do seu banco para pagar Pix
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Bumps */}
      {orderBumps && orderBumps.length > 0 && (
        <>
          {/* Divisor adicionado antes de Ofertas Limitadas */}
          <Divider />

          {/* Cabeçalho de Ofertas Limitadas - AJUSTADO */}
          {/* Removido o box do ícone, aumentado espaçamento vertical */}
          <div className="mt-8 mb-6">
            <h3 
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: design.colors.primaryText }}
            >
              <Zap className="w-5 h-5 fill-current" />
              Ofertas limitadas
            </h3>
          </div>
          
          <SharedOrderBumps
              orderBumps={orderBumps}
              selectedBumps={selectedBumps}
              onToggleBump={onToggleBump}
              design={design}
              mode={mode}
              disabled={disabled}
            />
        </>
      )}

      {/* Resumo do Pedido */}
      {productData && (
        <>
          <Divider />
          <SharedOrderSummary
              productData={productData}
              orderBumps={orderBumps}
              selectedBumps={selectedBumps}
              design={design}
              mode={mode}
              onTotalChange={onTotalChange}
            />
        </>
      )}

      {/* Botão de Finalizar Compra */}
      {/* Agora o botão aparece para AMBOS os métodos, unificando a UX */}
      <div className="mt-6">
        <SharedCheckoutButton
          selectedPayment={selectedPayment}
          design={design}
          mode={mode}
          isProcessing={isProcessing}
          disabled={disabled}
          onClick={handleCheckoutClick}
        />
      </div>

      {/* Conteúdo adicional (ex: Security Badges) */}
      {additionalContent}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {formWrapper ? formWrapper(content, formRef as React.RefObject<HTMLFormElement>) : content}
    </div>
  );
};
