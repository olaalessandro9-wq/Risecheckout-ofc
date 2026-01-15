/**
 * LinksTab - Aba de Links de Pagamento
 * 
 * Esta aba exibe os links de pagamento gerados automaticamente
 * para cada oferta do produto. Usa paymentLinks do ProductContext
 * para manter sincronia automática com a aba Geral.
 */

import { useState, useEffect } from "react";
import { useProductContext } from "../context/ProductContext";
import { LinksTable, PaymentLink } from "@/components/products/LinksTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LinksTab() {
  const { product, paymentLinks, refreshPaymentLinks } = useProductContext();
  const [loading, setLoading] = useState(true);

  // Carregar links na primeira vez
  useEffect(() => {
    if (product?.id) {
      refreshPaymentLinks().finally(() => setLoading(false));
    }
  }, [product?.id]);

  // Mapear paymentLinks do contexto para o formato da LinksTable
  const links: PaymentLink[] = paymentLinks
    .filter(link => link.status === 'active')
    .map(link => ({
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
      // Obter token de sessão para autenticação
      const sessionToken = localStorage.getItem('producer_session_token');
      
      // Alternar status via Edge Function
      const { data, error } = await supabase.functions.invoke('checkout-crud', {
        body: {
          action: 'toggle-link-status',
          linkId,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        data?.newStatus === 'active' 
          ? 'Link ativado com sucesso' 
          : 'Link desativado com sucesso'
      );

      // Atualizar links via contexto
      await refreshPaymentLinks();
    } catch (error: unknown) {
      console.error('Erro ao alterar status:', error);
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

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
