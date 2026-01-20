/**
 * LinksTab - Aba de Links de Pagamento
 * 
 * Esta aba exibe os links de pagamento gerados automaticamente
 * para cada oferta do produto. Usa paymentLinks do ProductContext
 * para manter sincronia automática com a aba Geral.
 */

import { useProductContext } from "../context/ProductContext";
import { LinksTable, PaymentLink } from "@/components/products/LinksTable";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";

const log = createLogger("LinksTab");

/**
 * LinksTab - Otimizado para usar cache do ProductContext
 * 
 * Dados já vêm carregados via product-full-loader (BFF).
 * Não faz fetch próprio - apenas refreshPaymentLinks após operações CRUD.
 * 
 * @see RISE Protocol V3 - Cache Hit Pattern
 */
export function LinksTab() {
  const { product, paymentLinks, refreshPaymentLinks, loading } = useProductContext();

  // Mapear paymentLinks do contexto para o formato da LinksTable
  // Mostra TODOS os links (ativos e inativos) para permitir reativação
  const links: PaymentLink[] = paymentLinks.map(link => ({
    id: link.id,
    slug: link.slug,
    url: link.url,
    offer_name: link.offer_name,
    offer_price: link.offer_price,
    is_default: link.is_default,
    status: link.status as 'active' | 'inactive',
    checkouts: link.checkouts || []
  }));

  const handleToggleStatus = async (linkId: string) => {
    try {
      // Alternar status via Edge Function
      const { data, error } = await api.call<{ error?: string; newStatus?: string }>('checkout-crud', {
        action: 'toggle-link-status',
        linkId,
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(
        data?.newStatus === 'active' 
          ? 'Link ativado com sucesso' 
          : 'Link desativado com sucesso'
      );

      // Atualizar links via contexto
      await refreshPaymentLinks();
    } catch (error: unknown) {
      log.error('Erro ao alterar status:', error);
      toast.error('Não foi possível alterar o status do link');
    }
  };

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  // Se ainda estiver carregando os dados iniciais do BFF
  if (loading && paymentLinks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-muted-foreground">Carregando links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Links de Pagamento
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Links gerados automaticamente para cada oferta. Cada link pode ser associado a múltiplos checkouts.
        </p>

        <LinksTable 
          links={links} 
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  );
}
