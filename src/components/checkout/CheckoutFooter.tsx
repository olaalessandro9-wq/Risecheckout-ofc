/**
 * CheckoutFooter
 * 
 * Footer reutilizável do checkout
 * Usado em: PublicCheckout, CheckoutPreview (builder/preview)
 */

import { Lock as LockIconLucide } from "lucide-react";

interface CheckoutFooterProps {
  colors?: {
    active?: string;
    footer?: {
      background?: string;
      border?: string;
      secondaryText?: string;
    };
  };
  maxWidth?: string;
}

export const CheckoutFooter = ({ colors, maxWidth = "1100px" }: CheckoutFooterProps) => {
  return (
    <footer 
      className="w-full mt-16 py-8 border-t-2"
      style={{ 
        backgroundColor: colors?.footer?.background || '#F9FAFB',
        borderTopColor: colors?.footer?.border || '#E5E7EB'
      }}
    >
      <div className="mx-auto px-4 space-y-6" style={{ maxWidth }}>
        {/* Badges de Segurança */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: colors?.active || '#10B981' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}>
              Pagamento 100% seguro
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <LockIconLucide className="w-4 h-4" style={{ color: colors?.active || '#10B981' }} />
            <span style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}>
              Site protegido
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: colors?.active || '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}>
              Diversas formas de pagamento
            </span>
          </div>
        </div>

        {/* Descrição */}
        <p 
          className="text-xs text-center leading-relaxed max-w-2xl mx-auto"
          style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}
        >
          Você está em uma página de checkout segura, criada com a tecnologia RiseCheckout. 
          A responsabilidade pela oferta é do vendedor.
        </p>

        {/* Links Legais */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a 
            href="/termos-de-uso" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-all"
            style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}
          >
            Termos de Uso
          </a>
          <span style={{ color: colors?.footer?.secondaryText || '#9CA3AF', opacity: 0.5 }}>•</span>
          <a 
            href="/politica-de-privacidade" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-all"
            style={{ color: colors?.footer?.secondaryText || '#9CA3AF' }}
          >
            Política de Privacidade
          </a>
        </div>

        {/* Copyright */}
        <div className="border-t pt-4" style={{ borderTopColor: colors?.footer?.border || '#E5E7EB' }}>
          <p 
            className="text-xs text-center"
            style={{ color: colors?.footer?.secondaryText || '#9CA3AF', opacity: 0.7 }}
          >
            © 2025 RiseCheckout LTDA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
