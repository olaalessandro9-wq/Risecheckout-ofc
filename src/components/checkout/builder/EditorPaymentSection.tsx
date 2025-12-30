import { Wallet, Lock as LockIconLucide, CheckCircle, ImageIcon } from "lucide-react";
import { formatBRL } from "@/lib/formatters/money";
import { ThemePreset } from "@/types/theme";
import { PixIcon, CreditCardIcon } from "@/components/icons";

interface EditorPaymentSectionProps {
  design: ThemePreset;
  selectedPayment: "pix" | "credit_card";
  onPaymentChange: (payment: "pix" | "credit_card") => void;
  productData?: any;
  totalPrice: number;
  selectedBumps: Set<string>;
  orderBumps: any[];
}

export const EditorPaymentSection = ({
  design,
  selectedPayment,
  onPaymentChange,
  productData,
  totalPrice,
  selectedBumps,
  orderBumps,
}: EditorPaymentSectionProps) => {
  // Estilos de botão
  const buttonBackgroundColor = typeof design.colors.button === 'string'
    ? design.colors.button
    : design.colors.button?.background || '#10B981';
  
  const buttonTextColor = typeof design.colors.button === 'string'
    ? '#FFFFFF'
    : design.colors.button?.text || '#FFFFFF';

  return (
    <div 
      className="rounded-xl p-5"
      style={{ backgroundColor: design.colors.formBackground || "#FFFFFF" }}
    >
      <h2 
        className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight"
        style={{ color: design.colors.primaryText || "#000000" }}
      >
        <Wallet className="w-5 h-5" />
        Pagamento
      </h2>
      
      <div className="space-y-2.5 mb-4">
        <button
          type="button"
          onClick={() => onPaymentChange('pix')}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left"
          style={{
            backgroundColor: design.colors.unselectedButton?.background || design.colors.formBackground,
            borderColor: selectedPayment === 'pix'
              ? design.colors.selectedButton?.background || design.colors.active
              : design.colors.border,
            borderWidth: selectedPayment === 'pix' ? '2px' : '2px',
            color: design.colors.unselectedButton?.text || design.colors.primaryText,
          }}
        >
          <div className="flex items-center gap-3">
            <PixIcon 
              className="w-5 h-5" 
              color={design.colors.unselectedButton?.icon || design.colors.primaryText}
            />
            <span className="font-semibold text-sm">PIX</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onPaymentChange('credit_card')}
          className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left"
          style={{
            backgroundColor: design.colors.unselectedButton?.background || design.colors.formBackground,
            borderColor: selectedPayment === 'credit_card'
              ? design.colors.selectedButton?.background || design.colors.active
              : design.colors.border,
            borderWidth: selectedPayment === 'credit_card' ? '2px' : '2px',
            color: design.colors.unselectedButton?.text || design.colors.primaryText,
          }}
        >
          <div className="flex items-center gap-3">
            <CreditCardIcon 
              className="w-5 h-5" 
              color={design.colors.unselectedButton?.icon || design.colors.primaryText}
            />
            <span className="font-semibold text-sm">Cartão de Crédito</span>
          </div>
        </button>
      </div>

      {/* Formulário de Cartão de Crédito - Preview */}
      {selectedPayment === 'credit_card' && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: design.colors.secondaryText }}>
            <LockIconLucide className="w-4 h-4" />
            <span>Pagamento 100% seguro e criptografado</span>
          </div>

          {/* Número do Cartão */}
          <div>
            <div 
              className="border rounded-md p-3 text-sm"
              style={{
                borderColor: design.colors.creditCardFields?.borderColor || design.colors.border || '#444444',
                backgroundColor: design.colors.creditCardFields?.backgroundColor || design.colors.formBackground || '#1F1F1F',
                color: design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText || '#999999'
              }}
            >
              Número do cartão
            </div>
          </div>

          {/* Nome do Titular */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: design.colors.primaryText }}>Nome do titular</label>
            <div 
              className="border rounded-md p-3 text-sm"
              style={{
                borderColor: design.colors.creditCardFields?.borderColor || design.colors.border,
                backgroundColor: design.colors.creditCardFields?.backgroundColor || design.colors.formBackground,
                color: design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText
              }}
            >
              Nome como está no cartão
            </div>
          </div>

          {/* Vencimento e CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div 
                className="border rounded-md p-3 text-sm"
                style={{
                  borderColor: design.colors.creditCardFields?.borderColor || design.colors.border || '#444444',
                  backgroundColor: design.colors.creditCardFields?.backgroundColor || design.colors.formBackground || '#1F1F1F',
                  color: design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText || '#999999'
                }}
              >
                MM/AA
              </div>
            </div>
            <div>
              <div 
                className="border rounded-md p-3 text-sm"
                style={{
                  borderColor: design.colors.creditCardFields?.borderColor || design.colors.border || '#444444',
                  backgroundColor: design.colors.creditCardFields?.backgroundColor || design.colors.formBackground || '#1F1F1F',
                  color: design.colors.creditCardFields?.placeholderColor || design.colors.secondaryText || '#999999'
                }}
              >
                CVV
              </div>
            </div>
          </div>

          {/* Parcelas */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: design.colors.primaryText }}>Parcelas</label>
            <div 
              className="border rounded-md p-3 text-sm flex justify-between items-center"
              style={{
                borderColor: design.colors.creditCardFields?.borderColor || design.colors.border,
                backgroundColor: design.colors.creditCardFields?.backgroundColor || design.colors.formBackground,
                color: design.colors.creditCardFields?.textColor || design.colors.primaryText
              }}
            >
              <span>1x de R$ 97,00</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem PIX - aparece ANTES dos order bumps quando PIX está selecionado */}
      {selectedPayment === 'pix' && (
        <div 
          className="rounded-lg p-4 space-y-2 mt-4"
          style={{
            backgroundColor: design.colors.active + '15',
            borderLeft: `4px solid ${design.colors.active}`
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: design.colors.active }} />
            <span className="font-semibold" style={{ color: design.colors.primaryText }}>
              Liberação imediata
            </span>
          </div>
          <p className="text-sm" style={{ color: design.colors.secondaryText }}>
            É simples, só usar o aplicativo de seu banco para pagar Pix
          </p>
        </div>
      )}

      {/* Resumo do Pedido - PIX */}
      {selectedPayment === 'pix' && (
        <>
          <h4 
            className="font-semibold mb-3 text-base mt-16"
            style={{ color: design.colors.orderSummary?.titleText || "#000000" }}
          >
            Resumo do pedido
          </h4>
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: design.colors.orderSummary?.background || "#F9FAFB",
              borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB",
            }}
          >
            
            {/* Produto Principal */}
            <div className="flex items-start gap-3 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}>
              {productData?.image_url ? (
                <img 
                  src={productData.image_url} 
                  alt={productData?.name || 'Produto'}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <h5 
                  className="text-sm font-medium leading-tight"
                  style={{ color: design.colors.orderSummary?.productName || "#000000" }}
                >
                  {productData?.name || "Nome do Produto"}
                </h5>
                <p 
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: design.colors.orderSummary?.priceText || "#000000" }}
                >
                  {productData?.price ? formatBRL(productData.price) : 'R$ 0,00'}
                </p>
              </div>
            </div>

            {/* Order Bumps Selecionados */}
            {selectedBumps.size > 0 && (
              <div className="space-y-2 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}>
                {Array.from(selectedBumps).map(bumpId => {
                  const bump = orderBumps.find(b => b.id === bumpId);
                  if (!bump) return null;
                  
                  return (
                    <div key={bumpId} className="flex items-start gap-3">
                      {bump.image_url && (
                        <img
                          src={bump.image_url}
                          alt={bump.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <p 
                          className="text-sm font-medium leading-tight line-clamp-1"
                          style={{ color: design.colors.orderSummary?.productName || "#000000" }}
                        >
                          {bump.name}
                        </p>
                        <p 
                          className="text-sm font-bold whitespace-nowrap"
                          style={{ color: design.colors.active }}
                        >
                          {formatBRL(Number(bump.price))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totais */}
            <div className="space-y-1.5 text-sm">
              <div 
                className="flex justify-between text-base font-bold pt-2 border-t"
                style={{ borderTopColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}
              >
                <span style={{ color: design.colors.orderSummary?.priceText || "#000000" }}>
                  Total
                </span>
                <span style={{ color: design.colors.orderSummary?.priceText || "#000000" }}>
                  {formatBRL(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Resumo do Pedido - Cartão */}
      {selectedPayment === 'credit_card' && (
        <>
          <h4 
            className="font-semibold mb-3 text-base mt-16"
            style={{ color: design.colors.orderSummary?.titleText || "#000000" }}
          >
            Resumo do pedido
          </h4>
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: design.colors.orderSummary?.background || "#F9FAFB",
              borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB",
            }}
          >
            
            {/* Produto Principal */}
            <div className="flex items-start gap-3 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}>
              {productData?.image_url ? (
                <img 
                  src={productData.image_url} 
                  alt={productData?.name || 'Produto'}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <h5 
                  className="text-sm font-medium leading-tight"
                  style={{ color: design.colors.orderSummary?.productName || "#000000" }}
                >
                  {productData?.name || "Nome do Produto"}
                </h5>
                <p 
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: design.colors.orderSummary?.priceText || "#000000" }}
                >
                  {productData?.price ? formatBRL(productData.price) : 'R$ 0,00'}
                </p>
              </div>
            </div>

            {/* Order Bumps Selecionados */}
            {selectedBumps.size > 0 && (
              <div className="space-y-2 mb-3 pb-3 border-b" style={{ borderColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}>
                {Array.from(selectedBumps).map(bumpId => {
                  const bump = orderBumps.find(b => b.id === bumpId);
                  if (!bump) return null;
                  
                  return (
                    <div key={bumpId} className="flex items-start gap-3">
                      {bump.image_url && (
                        <img
                          src={bump.image_url}
                          alt={bump.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <p 
                          className="text-sm font-medium leading-tight line-clamp-1"
                          style={{ color: design.colors.orderSummary?.productName || "#000000" }}
                        >
                          {bump.name}
                        </p>
                        <p 
                          className="text-sm font-bold whitespace-nowrap"
                          style={{ color: design.colors.active }}
                        >
                          {formatBRL(Number(bump.price))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totais */}
            <div className="space-y-1.5 text-sm">
              <div 
                className="flex justify-between text-base font-bold pt-2 border-t"
                style={{ borderTopColor: design.colors.orderSummary?.borderColor || "#D1D5DB" }}
              >
                <span style={{ color: design.colors.orderSummary?.priceText || "#000000" }}>
                  Total
                </span>
                <span style={{ color: design.colors.orderSummary?.priceText || "#000000" }}>
                  {formatBRL(totalPrice)}
                </span>
              </div>
            </div>

            <p 
              className="text-xs mt-2"
              style={{ color: design.colors.orderSummary?.labelText || "#6B7280" }}
            >
              à vista no Cartão de Crédito
            </p>
          </div>
        </>
      )}

      <button
        className="w-full mt-5 py-3.5 rounded-lg font-bold text-base transition-all duration-200 hover:opacity-90 shadow-sm"
        style={{
          backgroundColor: buttonBackgroundColor,
          color: buttonTextColor
        }}
      >
        {selectedPayment === 'pix' ? 'Pagar com PIX' : 'Pagar com Cartão de Crédito'}
      </button>

      {/* Security Badge Compacto */}
      <div className="mt-5 space-y-1">
        {/* Security badge */}
        <div className="flex items-center justify-center gap-2">
          <LockIconLucide className="w-4 h-4" style={{ color: design.colors.active || '#10b981' }} />
          <span className="text-sm font-medium" style={{ color: design.colors.secondaryText }}>
            Transação Segura e Criptografada
          </span>
        </div>
        
        {/* Description */}
        <p className="text-xs text-center" style={{ color: design.colors.secondaryText, opacity: 0.8 }}>
          Pagamento processado com segurança pela plataforma RiseCheckout
        </p>
      </div>
    </div>
  );
};
