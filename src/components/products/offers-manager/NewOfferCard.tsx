/**
 * NewOfferCard - Card inline para criação de nova oferta com auto-save
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { useState } from "react";
import { Loader2, Save, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MemberGroupSelect } from "./MemberGroupSelect";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { MemberGroupOption, Offer } from "./types";

interface NewOfferCardProps {
  productId: string;
  onSave: (offer: Offer) => void;
  onCancel: () => void;
  hasMembersArea: boolean;
  memberGroups: MemberGroupOption[];
}

interface CreateOfferResponse {
  success: boolean;
  offer?: Offer;
  error?: string;
}

export function NewOfferCard({
  productId,
  onSave,
  onCancel,
  hasMembersArea,
  memberGroups,
}: NewOfferCardProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [memberGroupId, setMemberGroupId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; price?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Nome da oferta é obrigatório";
    }
    
    if (price < 1) {
      newErrors.price = "O preço mínimo é R$ 0,01";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    try {
      const { data, error } = await api.call<CreateOfferResponse>("offer-crud", {
        action: "create",
        product_id: productId,
        name: name.trim(),
        price: price,
        is_default: false,
        member_group_id: memberGroupId,
      });
      
      if (error || !data?.success) {
        toast({
          title: "Erro ao criar oferta",
          description: data?.error || error?.message || "Tente novamente",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Oferta criada com sucesso!",
        description: "O link de pagamento foi gerado automaticamente.",
      });
      
      if (data.offer) {
        onSave(data.offer);
      } else {
        onSave({
          id: crypto.randomUUID(),
          name: name.trim(),
          price: price,
          is_default: false,
          member_group_id: memberGroupId,
        });
      }
    } catch (err) {
      toast({
        title: "Erro ao criar oferta",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = name.trim().length > 0 && price >= 1;

  return (
    <Card className="border-2 border-primary/50 bg-primary/5">
      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Nova Oferta</span>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="new-offer-name">Nome da Oferta</Label>
            <Input
              id="new-offer-name"
              placeholder="Ex: Plano Premium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-destructive" : ""}
              disabled={isSaving}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Este nome será usado para gerar o link de pagamento
              </p>
            )}
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <Label htmlFor="new-offer-price">Preço</Label>
            <CurrencyInput
              id="new-offer-price"
              value={price}
              onChange={setPrice}
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price ? (
              <p className="text-xs text-destructive">{errors.price}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                O preço mínimo é R$ 0,01
              </p>
            )}
          </div>
        </div>

        {/* Member Group Select */}
        {hasMembersArea && memberGroups.length > 0 && (
          <MemberGroupSelect
            offerId="new-offer"
            value={memberGroupId}
            onChange={setMemberGroupId}
            memberGroups={memberGroups}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isValid}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Oferta
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
