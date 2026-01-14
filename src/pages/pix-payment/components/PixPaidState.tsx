/**
 * PixPaidState - Estado de pagamento confirmado
 */

import { CheckCircle2 } from "lucide-react";

export function PixPaidState() {
  return (
    <div className="text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
      <h2 className="text-2xl font-bold text-gray-900">Pagamento confirmado!</h2>
      <p className="text-gray-600">Redirecionando...</p>
    </div>
  );
}
