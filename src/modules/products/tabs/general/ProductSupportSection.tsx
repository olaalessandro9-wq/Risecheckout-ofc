/**
 * ProductSupportSection - Seção de suporte ao cliente
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GeneralFormData, FormValidationErrors } from "../../types/formData.types";

type GeneralFormErrors = FormValidationErrors["general"];

interface Props {
  form: GeneralFormData;
  setForm: React.Dispatch<React.SetStateAction<GeneralFormData>>;
  errors: GeneralFormErrors;
  clearError: (field: keyof GeneralFormErrors) => void;
}

export function ProductSupportSection({ form, setForm, errors, clearError }: Props) {
  return (
    <div className="border-t border-border pt-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Suporte ao Cliente</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Aprenda como preencher os dados de suporte ao cliente.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="support-name" className="text-foreground">
            Nome de exibição do produtor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="support-name"
            value={form.support_name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, support_name: e.target.value }));
              if (errors.support_name) clearError("support_name");
            }}
            className={`bg-background text-foreground ${
              errors.support_name ? "border-red-500 focus:border-red-500" : "border-border"
            }`}
            placeholder="Digite o nome de exibição"
          />
          {errors.support_name && (
            <p className="text-sm text-red-500">{errors.support_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-email" className="text-foreground">
            E-mail de suporte <span className="text-destructive">*</span>
          </Label>
          <Input
            id="support-email"
            type="email"
            value={form.support_email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, support_email: e.target.value }));
              if (errors.support_email) clearError("support_email");
            }}
            className={`bg-background text-foreground ${
              errors.support_email ? "border-red-500 focus:border-red-500" : "border-border"
            }`}
            placeholder="Digite o e-mail de suporte"
          />
          {errors.support_email && (
            <p className="text-sm text-red-500">{errors.support_email}</p>
          )}
        </div>
      </div>
    </div>
  );
}
