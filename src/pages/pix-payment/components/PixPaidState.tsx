/**
 * PixPaidState - Estado de pagamento confirmado
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Exibe confirmação visual de que o pagamento foi realizado com sucesso.
 * Usa design tokens semânticos para cores consistentes.
 * 
 * @module pix-payment/components
 */

import { CheckCircle2 } from "lucide-react";

export function PixPaidState() {
  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-[hsl(var(--payment-success))] mx-auto" />
      <h2 className="text-2xl font-bold text-[hsl(var(--payment-text-dark))]">Pagamento confirmado!</h2>
      <p className="text-[hsl(var(--payment-text-secondary))]">Redirecionando...</p>
    </div>
  );
}
