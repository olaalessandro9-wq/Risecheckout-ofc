/**
 * PixPaidState - Estado de pagamento confirmado
 */

import { CheckCircle2 } from "lucide-react";

export function PixPaidState() {
  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-[hsl(var(--payment-success))] mx-auto" />
      <h2 className="text-2xl font-bold text-[hsl(var(--payment-card-text-primary))]">Pagamento confirmado!</h2>
      <p className="text-[hsl(var(--payment-card-text-secondary))]">Redirecionando...</p>
    </div>
  );
}
