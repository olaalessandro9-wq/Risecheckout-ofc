/**
 * SharedCheckoutButton
 * 
 * Componente compartilhado para botão de finalizar compra
 * Usado por: Builder, Preview e Checkout Público
 * 
 * Garante consistência visual entre todos os modos
 */

import React from 'react';
import { Loader2, Lock } from 'lucide-react';

interface SharedCheckoutButtonProps {
  selectedPayment: 'pix' | 'credit_card';
  design: {
    colors: {
      button: {
        text: string;
        background: string;
      };
      primaryText: string;
      secondaryText: string;
    };
  };
  mode?: 'editor' | 'preview' | 'public';
  isProcessing?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const SharedCheckoutButton: React.FC<SharedCheckoutButtonProps> = ({
  selectedPayment,
  design,
  mode = 'public',
  isProcessing = false,
  disabled = false,
  onClick,
}) => {
  const buttonText = selectedPayment === 'pix' 
    ? 'Pagar com PIX' 
    : 'Finalizar Compra Segura';

  const handleClick = (e: React.MouseEvent) => {
    // Lógica Blindada:
    // Se tiver onClick, sempre usamos ele, prevenindo o comportamento padrão.
    // Isso garante que a validação rode independente de ter tag <form> ou não.
    if (onClick) {
      e.preventDefault(); 
      onClick();
    }
  };

  return (
    <div className="space-y-3">
      {/* Botão Principal */}
      <button
        type={mode === 'public' ? 'submit' : 'button'}
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className="w-full h-[60px] rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
        style={{
          backgroundColor: design.colors.button.background,
          color: design.colors.button.text,
        }}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processando...
          </span>
        ) : (
          buttonText
        )}
      </button>

      {/* Mensagens de Segurança */}
      <div className="space-y-2 text-center">
        <p 
          className="text-sm flex items-center justify-center gap-2"
          style={{ color: design.colors.primaryText }}
        >
          <Lock className="w-4 h-4" />
          <span className="font-medium">Transação Segura e Criptografada</span>
        </p>
        <p 
          className="text-xs"
          style={{ color: design.colors.secondaryText }}
        >
          Pagamento processado com segurança pela plataforma RiseCheckout
        </p>
      </div>
    </div>
  );
};
