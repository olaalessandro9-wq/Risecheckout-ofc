/**
 * Stripe Info Card Component
 * 
 * @module integrations/gateways/stripe/components
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * 
 * Card com informações sobre o Stripe.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InfoCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Sobre o Stripe</CardTitle>
        <CardDescription>
          Aceite pagamentos com cartão de crédito e PIX
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>• Cartão de crédito com parcelamento</p>
        <p>• PIX instantâneo</p>
        <p>• Split automático de pagamentos</p>
        <p>• Taxa da plataforma: 7,5%</p>
      </CardContent>
    </Card>
  );
}
