/**
 * Página: PublicCheckoutV2 (Loader)
 * 
 * REFATORADO: Lógica de conteúdo extraída para PublicCheckoutV2Content
 * Este arquivo agora é apenas um Loader (< 50 linhas)
 */

import React from "react";
import { Loader2 } from "lucide-react";
import { useCheckoutData } from "@/hooks/checkout/useCheckoutData";
import { PublicCheckoutV2Content } from "./PublicCheckoutV2Content";

const PublicCheckoutV2: React.FC = () => {
  const { checkout, design, orderBumps, isLoading, isError } = useCheckoutData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !checkout || !design || !checkout.product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout não encontrado</h1>
          <p className="text-gray-600">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  const validatedCheckout = checkout as typeof checkout & { 
    product: NonNullable<typeof checkout.product> 
  };

  return (
    <PublicCheckoutV2Content
      checkout={validatedCheckout}
      design={design}
      orderBumps={orderBumps || []}
    />
  );
};

export default PublicCheckoutV2;
