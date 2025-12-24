/**
 * ProductInfoSection - Seção de informações do produto (Nome + Descrição)
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GeneralFormData, GeneralFormErrors } from "./types";

interface Props {
  form: GeneralFormData;
  setForm: React.Dispatch<React.SetStateAction<GeneralFormData>>;
  errors: GeneralFormErrors;
  clearError: (field: keyof GeneralFormErrors) => void;
}

export function ProductInfoSection({ form, setForm, errors, clearError }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">Produto</h3>
      <p className="text-sm text-muted-foreground mb-6">
        A aprovação do produto é instantânea. Ou seja, você pode cadastrá-lo e já começar a vender. 
        A imagem do produto é exibida na área de membros e no seu programa de afiliados.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-name" className="text-foreground">
            Nome do Produto
          </Label>
          <Input
            id="product-name"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) clearError("name");
            }}
            className={`bg-background text-foreground ${
              errors.name ? "border-red-500 focus:border-red-500" : "border-border"
            }`}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-description" className="text-foreground">
            Descrição <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="product-description"
            value={form.description}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }));
              if (errors.description) clearError("description");
            }}
            className={`bg-background text-foreground min-h-[100px] ${
              errors.description ? "border-red-500 focus:border-red-500" : "border-border"
            }`}
            placeholder="Descreva seu produto (mínimo 100 caracteres)"
          />
          <div className="flex justify-between">
            {errors.description ? (
              <p className="text-sm text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ${
                form.description.length < 100 ? "text-muted-foreground" : "text-green-500"
              }`}
            >
              {form.description.length}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
