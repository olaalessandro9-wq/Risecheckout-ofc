/**
 * ConfiguracoesTab - Aba de Configurações do Produto
 * 
 * Esta aba gerencia:
 * - Campos obrigatórios do checkout (nome, email, telefone, CPF)
 * - Método de pagamento padrão (PIX ou Cartão)
 * - Gateways de pagamento (PushinPay, MercadoPago, Stripe, etc.)
 */

import { useProductContext } from "../context/ProductContext";
import ProductSettingsPanel from "@/components/products/ProductSettingsPanel";

export function ConfiguracoesTab() {
  const { product, updateSettingsModified } = useProductContext();

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <ProductSettingsPanel 
      productId={product.id}
      onModifiedChange={updateSettingsModified}
    />
  );
}
