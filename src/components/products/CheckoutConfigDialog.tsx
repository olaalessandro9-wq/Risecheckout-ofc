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
import { createLogger } from "@/lib/logger";

const log = createLogger("CheckoutConfigDialog");
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import type { Checkout } from "./CheckoutTable";

interface Offer {
  id: string;
  name: string;
  price: number;
  is_default: boolean;
}

/** Payload for checkout-crud edge function */
interface CheckoutCrudPayload {
  action: 'create' | 'update';
  name: string;
  isDefault: boolean;
  offerId: string;
  checkoutId?: string;
  productId?: string;
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
      const action = checkout?.id ? 'update' : 'create';
      const payload: CheckoutCrudPayload = {
        action,
        name,
        isDefault,
        offerId: selectedOfferId,
      };

      if (checkout?.id) {
        payload.checkoutId = checkout.id;
      } else {
        payload.productId = productId;
      }

      const { data, error } = await api.call<{ success?: boolean; error?: string; data?: { checkout?: { id: string; linkId: string } } }>('checkout-crud', payload);

      if (error) {
        log.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao salvar checkout');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao salvar checkout');
      }

      const updatedCheckout: Checkout = {
        id: data.data?.checkout?.id || checkout?.id || '',
        name,
        isDefault,
        linkId: data.data?.checkout?.linkId || "",
        price: availableOffers.find(o => o.id === selectedOfferId)?.price || 0,
        offer: availableOffers.find(o => o.id === selectedOfferId)?.name || "",
        visits: checkout?.visits || 0,
      };

      onSave(updatedCheckout, selectedOfferId);
      toast.success('Checkout configurado com sucesso!');
      onOpenChange(false);
    } catch (error: unknown) {
      log.error('Erro ao salvar checkout:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível salvar o checkout';
      toast.error(message);
    } finally {
      setSaving(false);
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
