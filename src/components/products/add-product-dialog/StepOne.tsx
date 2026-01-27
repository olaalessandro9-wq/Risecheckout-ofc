/**
 * Step One - Dados básicos do produto
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PRODUCT_FIELD_LIMITS } from "@/lib/constants/field-limits";
import type { AddProductFormData } from "./types";

interface StepOneProps {
  formData: AddProductFormData;
  onUpdate: (updates: Partial<AddProductFormData>) => void;
}

export function StepOne({ formData, onUpdate }: StepOneProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">Nome do Produto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="bg-background border-border text-foreground"
          placeholder="Digite o nome do produto"
          maxLength={PRODUCT_FIELD_LIMITS.NAME}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.name.length}/{PRODUCT_FIELD_LIMITS.NAME}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="bg-background border-border text-foreground min-h-[100px]"
          placeholder="Digite a descrição do produto"
          maxLength={PRODUCT_FIELD_LIMITS.DESCRIPTION}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/{PRODUCT_FIELD_LIMITS.DESCRIPTION}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price" className="text-foreground">Preço</Label>
        <CurrencyInput
          id="price"
          value={formData.price}
          onChange={(newValue) => onUpdate({ price: newValue })}
          className="bg-background border-border text-foreground"
        />
      </div>
    </div>
  );
}
