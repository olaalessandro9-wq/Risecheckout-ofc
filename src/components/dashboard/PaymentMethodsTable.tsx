import { Card } from "@/components/ui/card";
import { CreditCard, Smartphone } from "lucide-react";
import { formatCentsToBRL } from "@/lib/money";

interface PaymentMethod {
  name: string;
  icon: "pix" | "card";
  conversion: string;
  value: number;
}

// Valores em CENTAVOS (arquitetura Integer First)
const paymentMethods: PaymentMethod[] = [
  { name: "Pix", icon: "pix", conversion: "79,3%", value: 68827 },  // R$ 688,27
  { name: "Cartão de crédito", icon: "card", conversion: "75,0%", value: 8541 },  // R$ 85,41
];

export function PaymentMethodsTable() {
  return (
    <Card className="p-6 bg-gradient-card border-border shadow-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left pb-4 text-sm font-medium text-muted-foreground">
              Meios de Pagamento
            </th>
            <th className="text-left pb-4 text-sm font-medium text-muted-foreground">
              Conversão
            </th>
            <th className="text-right pb-4 text-sm font-medium text-muted-foreground">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {paymentMethods.map((method) => (
            <tr key={method.name} className="border-b border-border/50 last:border-0">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  {method.icon === "pix" ? (
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                  <span className="text-foreground">{method.name}</span>
                </div>
              </td>
              <td className="py-4 text-foreground">{method.conversion}</td>
              <td className="py-4 text-right text-foreground">
                {formatCentsToBRL(method.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
