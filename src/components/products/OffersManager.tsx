import { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export interface Offer {
  id: string;
  name: string;
  price: number; // Centavos
  is_default: boolean;
}

interface OfferError {
  name?: string;
  price?: string;
}

interface OffersManagerProps {
  productId: string | null;
  productName: string;
  defaultPrice: string;
  offers: Offer[];
  onOffersChange: (offers: Offer[]) => void;
  onModifiedChange: (modified: boolean) => void;
  onOfferDeleted?: (offerId: string) => void;
}

export const OffersManager = ({
  productId,
  productName,
  defaultPrice,
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
}: OffersManagerProps) => {
  const [errors, setErrors] = useState<Record<string, OfferError>>({});

  // Validar uma oferta específica
  const validateOffer = (offer: Offer): OfferError => {
    const error: OfferError = {};
    
    if (!offer.name || offer.name.trim() === "") {
      error.name = "Campo obrigatório";
    }
    
    if (!offer.price || offer.price <= 0) {
      error.price = "O preço mínimo é R$ 0,01";
    }
    
    return error;
  };

  // Verificar se há ofertas com erros
  const hasErrors = (): boolean => {
    const newErrors: Record<string, OfferError> = {};
    let hasError = false;

    offers.forEach(offer => {
      const error = validateOffer(offer);
      if (Object.keys(error).length > 0) {
        newErrors[offer.id] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return hasError;
  };

  const handleAddOffer = () => {
    // Verificar se há ofertas incompletas antes de adicionar nova
    const nonDefaultOffers = offers.filter(o => !o.is_default);
    if (nonDefaultOffers.length > 0) {
      const hasIncomplete = nonDefaultOffers.some(offer => {
        const error = validateOffer(offer);
        return Object.keys(error).length > 0;
      });

      if (hasIncomplete) {
        hasErrors();
        toast.error("Preencha todos os campos da oferta anterior antes de adicionar uma nova");
        return;
      }
    }

    const newOffer: Offer = {
      id: `temp-${Date.now()}`,
      name: "",
      price: 0,
      is_default: false,
    };
    
    onOffersChange([...offers, newOffer]);
    onModifiedChange(true);
  };

  const handleRemoveOffer = (id: string) => {
    const offerToRemove = offers.find(o => o.id === id);
    
    // Não permitir remover oferta principal
    if (offerToRemove?.is_default) {
      toast.error("A oferta principal não pode ser removida");
      return;
    }
    
    // Notificar que oferta foi deletada (se não for temporária)
    if (!id.startsWith('temp-') && onOfferDeleted) {
      onOfferDeleted(id);
    }
    
    const newOffers = offers.filter(o => o.id !== id);
    onOffersChange(newOffers);
    onModifiedChange(true);
    
    // Remover erros da oferta removida
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
    
    toast.success("Oferta removida");
  };

  const handleUpdateOffer = (id: string, field: keyof Offer, value: any) => {
    const updatedOffers = offers.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    );
    
    onOffersChange(updatedOffers);
    onModifiedChange(true);
    
    // Validar oferta atualizada
    const updatedOffer = updatedOffers.find(o => o.id === id);
    if (updatedOffer) {
      const error = validateOffer(updatedOffer);
      const newErrors = { ...errors };
      
      if (Object.keys(error).length === 0) {
        delete newErrors[id];
      } else {
        newErrors[id] = error;
      }
      
      setErrors(newErrors);
    }
  };

  // Separar ofertas em principal e adicionais
  const defaultOffer = offers.find(o => o.is_default);
  const additionalOffers = offers.filter(o => !o.is_default);

  return (
    <div className="border-t border-border pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Ofertas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as diferentes variações de preço deste produto
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Quando ativado, você poderá criar múltiplas ofertas com preços diferentes. Cada oferta gerará um link de pagamento único automaticamente.
        </p>
      </div>

      <div className="space-y-3">
        {/* OFERTA PRINCIPAL */}
        {defaultOffer && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
            <div className="flex items-start justify-between">
              <Badge variant="default" className="mb-2">
                Oferta Principal
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`offer-name-${defaultOffer.id}`}>
                  Nome da Oferta
                </Label>
                <Input
                  id={`offer-name-${defaultOffer.id}`}
                  value={defaultOffer.name}
                  onChange={(e) => handleUpdateOffer(defaultOffer.id, 'name', e.target.value)}
                  placeholder="Ex: Plano Básico"
                  className={errors[defaultOffer.id]?.name ? "border-destructive" : ""}
                />
                {errors[defaultOffer.id]?.name && (
                  <p className="text-xs text-destructive">{errors[defaultOffer.id].name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Este nome será usado para gerar o link de pagamento
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`offer-price-${defaultOffer.id}`}>
                  Preço
                </Label>
                <CurrencyInput
                  id={`offer-price-${defaultOffer.id}`}
                  value={defaultOffer.price}
                  onChange={(value) => handleUpdateOffer(defaultOffer.id, 'price', value)}
                  className={errors[defaultOffer.id]?.price ? "border-destructive" : ""}
                />
                {errors[defaultOffer.id]?.price && (
                  <p className="text-xs text-destructive">{errors[defaultOffer.id].price}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OFERTAS ADICIONAIS */}
        {additionalOffers.map((offer) => (
          <div
            key={offer.id}
            className="border border-border rounded-lg p-4 space-y-4 bg-background/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOffer(offer.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`offer-name-${offer.id}`}>
                  Nome da Oferta
                </Label>
                <Input
                  id={`offer-name-${offer.id}`}
                  value={offer.name}
                  onChange={(e) => handleUpdateOffer(offer.id, 'name', e.target.value)}
                  placeholder="Ex: Plano Premium"
                  className={errors[offer.id]?.name ? "border-destructive" : ""}
                />
                {errors[offer.id]?.name && (
                  <p className="text-xs text-destructive">{errors[offer.id].name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Este nome será usado para gerar o link de pagamento
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`offer-price-${offer.id}`}>
                  Preço
                </Label>
                <CurrencyInput
                  id={`offer-price-${offer.id}`}
                  value={offer.price}
                  onChange={(value) => handleUpdateOffer(offer.id, 'price', value)}
                  className={errors[offer.id]?.price ? "border-destructive" : ""}
                />
                {errors[offer.id]?.price && (
                  <p className="text-xs text-destructive">{errors[offer.id].price}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* BOTÃO ADICIONAR NOVA OFERTA */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOffer}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Oferta
        </Button>
      </div>
    </div>
  );
};
