/**
 * LinksTab - Aba de Links de Pagamento
 * 
 * Esta aba exibe os links de pagamento gerados automaticamente
 * para cada oferta do produto. Permite:
 * - Visualizar todos os links
 * - Copiar links
 * - Abrir links em nova aba
 * - Ativar/Desativar links
 * 
 * Os links são gerados automaticamente quando ofertas são criadas na aba Geral.
 */

import { useState, useEffect } from "react";
import { useProductContext } from "../context/ProductContext";
import { LinksTable, PaymentLink } from "@/components/products/LinksTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LinksTab() {
  const { product } = useProductContext();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar links do produto
  useEffect(() => {
    if (product?.id) {
      loadLinks();
    }
  }, [product?.id]);

  const loadLinks = async () => {
    if (!product?.id) return;

    try {
      setLoading(true);

      // Buscar payment_links com suas ofertas relacionadas
      const { data: paymentLinks, error: linksError } = await supabase
        .from('payment_links')
        .select(`
          id,
          slug,
          url,
          status,
          offer:offers (
            id,
            name,
            price,
            is_default,
            product_id,
            status
          )
        `)
        .eq('offer.product_id', product.id)
        .eq('status', 'active') // Apenas links ativos
        .eq('offer.status', 'active') // Apenas ofertas ativas
        .order('created_at', { ascending: true });

      if (linksError) throw linksError;

      // Para cada link, buscar checkouts associados através da oferta
      const linksData: PaymentLink[] = [];

      for (const link of paymentLinks || []) {
        if (!link.offer) continue;

        // Buscar checkouts associados a este link através de checkout_links
        const { data: checkoutLinks, error: checkoutError } = await supabase
          .from('checkout_links')
          .select(`
            checkout:checkouts (
              id,
              name
            )
          `)
          .eq('link_id', link.id);  // ✅ Coluna correta: link_id

        if (checkoutError) {
          console.error('Erro ao buscar checkouts:', checkoutError);
        }

        // Mapear checkouts
        const checkouts = (checkoutLinks || [])
          .map(cl => cl.checkout)
          .filter(Boolean)
          .map(checkout => ({
            id: checkout.id,
            name: checkout.name
          }));

        linksData.push({
          id: link.id,
          slug: link.slug,
          url: link.url,
          offer_name: link.offer.name,
          offer_price: link.offer.price,
          is_default: link.offer.is_default || false,
          status: link.status === 'active' ? 'active' : 'inactive',
          checkouts: checkouts
        });
      }

      setLinks(linksData);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      toast.error('Não foi possível carregar os links de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (linkId: string) => {
    try {
      // Buscar status atual
      const { data: link, error: fetchError } = await supabase
        .from('payment_links')
        .select('status')
        .eq('id', linkId)
        .single();

      if (fetchError) throw fetchError;

      // Alternar status
      const newStatus = link.status === 'active' ? 'inactive' : 'active';

      const { error: updateError } = await supabase
        .from('payment_links')
        .update({ status: newStatus })
        .eq('id', linkId);

      if (updateError) throw updateError;

      toast.success(
        newStatus === 'active' 
          ? 'Link ativado com sucesso' 
          : 'Link desativado com sucesso'
      );

      // Recarregar links
      loadLinks();
    } catch (error) {
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
