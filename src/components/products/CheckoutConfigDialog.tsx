/**
 * CheckoutConfigDialog - Dialog de Configuração de Checkout
 * 
 * Permite configurar:
 * - Nome do checkout
 * - Definir como checkout padrão
 * - Selecionar oferta do checkout
 * 
 * Lógica de links:
 * - Se oferta não está em uso → reutiliza payment_link existente
 * - Se oferta já está em outro checkout → cria novo payment_link
 */

import { useState, useEffect } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBRL } from "@/lib/formatters/money";
import type { Checkout } from "./CheckoutTable";

interface Offer {
  id: string;
  name: string;
  price: number;
  is_default: boolean;
}

interface CheckoutConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (checkout: Checkout, selectedOfferId: string) => void;
  checkout?: Checkout;
  availableOffers: Offer[];
  currentOfferId?: string;
  productId: string;
}

export const CheckoutConfigDialog = ({
  open,
  onOpenChange,
  onSave,
  checkout,
  availableOffers,
  currentOfferId = "",
  productId,
}: CheckoutConfigDialogProps) => {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (checkout) {
      setName(checkout.name);
      setIsDefault(checkout.isDefault);
      setSelectedOfferId(currentOfferId);
    } else {
      setName("");
      setIsDefault(false);
      // Selecionar automaticamente a oferta padrão para novos checkouts
      const defaultOffer = availableOffers.find(offer => offer.is_default);
      setSelectedOfferId(defaultOffer ? defaultOffer.id : (availableOffers[0]?.id || ""));
    }
  }, [checkout, open, currentOfferId, availableOffers]);

  const handleSave = async () => {
    if (!name || !selectedOfferId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      let finalCheckoutId = checkout?.id;

      // Se é novo checkout, criar
      if (!checkout?.id) {
        const { data: newCheckout, error: createError } = await supabase
          .from('checkouts')
          .insert({
            product_id: productId,
            name: name,
            is_default: isDefault
          })
          .select('id')
          .single();

        if (createError) throw createError;
        finalCheckoutId = newCheckout.id;
      } else {
        // Atualizar checkout existente
        const { error: updateError } = await supabase
          .from('checkouts')
          .update({
            name: name,
            is_default: isDefault
          })
          .eq('id', checkout.id);

        if (updateError) throw updateError;
      }

      // Se marcou como padrão, desmarcar outros
      if (isDefault) {
        await supabase
          .from('checkouts')
          .update({ is_default: false })
          .eq('product_id', productId)
          .neq('id', finalCheckoutId);
      }

      // Gerenciar link de pagamento
      await managePaymentLink(finalCheckoutId!, selectedOfferId);

      // Callback de sucesso
      const updatedCheckout: Checkout = {
        id: finalCheckoutId!,
        name,
        isDefault,
        linkId: "",
        price: availableOffers.find(o => o.id === selectedOfferId)?.price || 0,
        offer: availableOffers.find(o => o.id === selectedOfferId)?.name || "",
        visits: checkout?.visits || 0,
      };

      onSave(updatedCheckout, selectedOfferId);
      toast.success('Checkout configurado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar checkout:', error);
      toast.error('Não foi possível salvar o checkout');
    } finally {
      setSaving(false);
    }
  };

  const managePaymentLink = async (checkoutId: string, offerId: string) => {
    // 1. Verificar se checkout já tem link associado
    const { data: currentLink } = await supabase
      .from('checkout_links')
      .select(`
        link_id,
        payment_links!inner (
          id,
          offer_id
        )
      `)
      .eq('checkout_id', checkoutId)
      .maybeSingle();

    // 2. Se checkout já tem link da oferta selecionada → MANTER (não fazer nada)
    if (currentLink && currentLink.payment_links.offer_id === offerId) {
      console.log('[CHECKOUT] Checkout já tem link da oferta selecionada, mantendo...');
      return;
    }

    // 3. Verificar se a oferta já está sendo usada em outro checkout
    const { data: offerInUse } = await supabase
      .from('checkout_links')
      .select(`
        id,
        payment_links!inner (
          offer_id
        )
      `)
      .eq('payment_links.offer_id', offerId)
      .neq('checkout_id', checkoutId)
      .maybeSingle();

    let linkId: string;

    if (offerInUse) {
      // 4a. Oferta já está em uso → criar novo payment_link
      console.log('[CHECKOUT] Oferta em uso, criando novo link...');
      const { generateUniqueSlug } = await import('@/lib/utils/generateSlug');
      const slug = generateUniqueSlug();

      const { data: newLink, error: createLinkError } = await supabase
        .from('payment_links')
        .insert({
          offer_id: offerId,
          slug: slug,
          url: `${window.location.origin}/c/${slug}`,
          status: 'active',
          is_original: false  // Link duplicado (filho)
        })
        .select('id')
        .single();

      if (createLinkError) throw createLinkError;
      linkId = newLink.id;
    } else {
      // 4b. Oferta não está em uso → buscar link disponível (órfão)
      const { data: availableLink } = await supabase
        .from('payment_links')
        .select('id')
        .eq('offer_id', offerId)
        .eq('status', 'active')
        .is('checkout_links.checkout_id', null)
        .maybeSingle();

      if (availableLink) {
        console.log('[CHECKOUT] Reutilizando link órfão...');
        linkId = availableLink.id;
      } else {
        // Buscar qualquer link da oferta (mesmo que em uso)
        const { data: anyLink } = await supabase
          .from('payment_links')
          .select('id')
          .eq('offer_id', offerId)
          .eq('status', 'active')
          .maybeSingle();

        if (anyLink) {
          console.log('[CHECKOUT] Reutilizando link existente...');
          linkId = anyLink.id;
        } else {
          // Criar novo link
          console.log('[CHECKOUT] Criando novo link...');
          const { generateUniqueSlug } = await import('@/lib/utils/generateSlug');
          const slug = generateUniqueSlug();

          const { data: newLink, error: createLinkError } = await supabase
            .from('payment_links')
            .insert({
              offer_id: offerId,
              slug: slug,
              url: `${window.location.origin}/c/${slug}`,
              status: 'active',
              is_original: true  // Link original (mãe)
            })
            .select('id')
            .single();

          if (createLinkError) throw createLinkError;
          linkId = newLink.id;
        }
      }
    }

    // 5. Associar link ao checkout
    if (currentLink) {
      // Atualizar associação existente
      console.log('[CHECKOUT] Atualizando associação checkout → link...');
      await supabase
        .from('checkout_links')
        .update({ link_id: linkId })
        .eq('checkout_id', checkoutId);
    } else {
      // Criar nova associação
      console.log('[CHECKOUT] Criando nova associação checkout → link...');
      await supabase
        .from('checkout_links')
        .insert({
          checkout_id: checkoutId,
          link_id: linkId
        });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">
              {checkout ? "Editar checkout" : "Criar checkout"}
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
              disabled={saving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="checkout-name" className="text-foreground">
              Nome
            </Label>
            <Input
              id="checkout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do checkout"
              className="bg-background border-border"
              disabled={saving}
            />
          </div>

          {/* Definir como padrão */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Label htmlFor="default-checkout" className="text-foreground font-medium cursor-pointer">
              Definir como checkout padrão
            </Label>
            <Switch
              id="default-checkout"
              checked={isDefault}
              onCheckedChange={setIsDefault}
              disabled={saving}
            />
          </div>

          {/* Seleção de Oferta */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">
              Oferta do Checkout
            </Label>
            <p className="text-sm text-muted-foreground">
              Selecione qual oferta será vendida neste checkout
            </p>

            {availableOffers.length === 0 ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">
                    Nenhuma oferta disponível
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-1">
                    Crie ofertas na aba "Geral" para poder associá-las a checkouts.
                  </p>
                </div>
              </div>
            ) : (
              <RadioGroup 
                value={selectedOfferId} 
                onValueChange={setSelectedOfferId}
                disabled={saving}
              >
                <div className="space-y-2 border border-border rounded-lg p-4">
                  {availableOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={offer.id} id={`offer-${offer.id}`} />
                      <div className="flex-1">
                        <Label
                          htmlFor={`offer-${offer.id}`}
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          {offer.name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBRL(offer.price)}
                        </p>
                        {offer.is_default && (
                          <span className="text-xs text-primary">
                            (Oferta Principal)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>


        </div>

        {/* Ações */}
        <div className="flex gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || !selectedOfferId || saving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
