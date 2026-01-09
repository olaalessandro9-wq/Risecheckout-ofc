/**
 * OrderSummarySticky - Resumo do Pedido para Coluna Direita (Sticky)
 * 
 * Componente UNIFICADO que mostra TUDO em 1 bloco:
 * - Foto do produto
 * - Nome do produto
 * - Preço
 * - Total
 * - Badges de segurança
 * - Contato do vendedor
 * 
 * ❌ NÃO mostra order bumps (ocuparia muito espaço)
 * 
 * Usado na coluna direita do checkout (desktop only)
 * Cores personalizáveis via design
 */

import { useState } from "react";
import { ImageIcon } from "@/components/icons/ImageIcon";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { Lock, Shield, CreditCard, Mail } from "lucide-react";

interface OrderSummaryStickyProps {
  productData?: {
    name: string;
    price: number;
    image_url?: string | null;
    support_email?: string;
  };
  design: any;
  isPreviewMode?: boolean;
}

export const OrderSummarySticky = ({
  productData,
  design,
  isPreviewMode = false
}: OrderSummaryStickyProps) => {
  const [showEmail, setShowEmail] = useState(false);
  
  // Calcular total (apenas produto, SEM bumps)
  const productPrice = productData?.price ? Number(productData.price) : 0;

  return (
    <div 
      className="rounded-xl p-6 sticky top-6"
      style={{ 
        backgroundColor: design.colors.formBackground || "#FFFFFF"
      }}
    >
      {/* Título */}
      <h3 
        className="text-lg font-bold mb-5"
        style={{ color: design.colors.primaryText || "#000000" }}
      >
        Resumo do pedido
      </h3>

      {/* Produto Principal */}
      <div className="flex items-start gap-4 pb-5 mb-5 border-b" style={{ borderColor: design.colors.border || "#E5E7EB" }}>
        {productData?.image_url ? (
          <img 
            src={productData.image_url} 
            alt={productData?.name || 'Produto'}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 
            className="text-sm font-medium leading-tight mb-3"
            style={{ color: design.colors.primaryText || "#000000" }}
          >
            {productData?.name || "Nome do Produto"}
          </h4>
          <p 
            className="text-lg font-bold"
            style={{ color: design.colors.active || "#10B981" }}
          >
            {productData?.price ? formatBRL(productData.price) : 'R$ 0,00'}
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pb-5 mb-5 border-b" style={{ borderColor: design.colors.border || "#E5E7EB" }}>
        <span 
          className="text-lg font-bold"
          style={{ color: design.colors.primaryText || "#000000" }}
        >
          Total
        </span>
        <span 
          className="text-2xl font-bold"
          style={{ color: design.colors.active || "#10B981" }}
        >
          {formatBRL(productPrice)}
        </span>
      </div>

      {/* Badges de Segurança */}
      <div className="space-y-3 mb-5 pb-5 border-b" style={{ borderColor: design.colors.border || "#E5E7EB" }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: design.colors.active + "20" || "#10B98120" }}
          >
            <Lock 
              className="w-5 h-5" 
              style={{ color: design.colors.active || "#10B981" }}
            />
          </div>
          <span 
            className="text-sm font-medium"
            style={{ color: design.colors.secondaryText || "#6B7280" }}
          >
            Pagamento 100% seguro
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: design.colors.active + "20" || "#10B98120" }}
          >
            <Shield 
              className="w-5 h-5" 
              style={{ color: design.colors.active || "#10B981" }}
            />
          </div>
          <span 
            className="text-sm font-medium"
            style={{ color: design.colors.secondaryText || "#6B7280" }}
          >
            Dados protegidos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: design.colors.active + "20" || "#10B98120" }}
          >
            <CreditCard 
              className="w-5 h-5" 
              style={{ color: design.colors.active || "#10B981" }}
            />
          </div>
          <span 
            className="text-sm font-medium"
            style={{ color: design.colors.secondaryText || "#6B7280" }}
          >
            Compra segura
          </span>
        </div>
      </div>

      {/* Contato do Vendedor */}
      <div className="text-center">
        {!showEmail ? (
          <button
            onClick={() => setShowEmail(true)}
            className="text-sm font-medium hover:underline transition-all inline-flex items-center gap-2"
            style={{ color: design.colors.active || "#10B981" }}
          >
            <Mail className="w-4 h-4" />
            Veja o contato do vendedor
          </button>
        ) : (
          <div className="space-y-2">
            <p 
              className="text-xs font-medium"
              style={{ color: design.colors.secondaryText || "#6B7280" }}
            >
              Email de suporte:
            </p>
            <a
              href={`mailto:${productData?.support_email}`}
              className="text-sm font-bold hover:underline break-all"
              style={{ color: design.colors.active || "#10B981" }}
            >
              {productData?.support_email || "suporte@exemplo.com"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
