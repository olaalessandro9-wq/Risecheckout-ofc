/**
 * Seção de campos obrigatórios do checkout
 */

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";
import type { SettingsFormProps } from "./types";

interface FieldToggleProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
  hint: string;
}

function FieldToggle({ label, checked, disabled, onChange, hint }: FieldToggleProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        <Switch
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
          aria-readonly={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3.5 w-3.5" /> {hint}
      </p>
    </div>
  );
}

export function RequiredFieldsSection({ form, setForm }: SettingsFormProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium">Campos do checkout</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldToggle
          label="Nome completo"
          checked={form.required_fields.name}
          disabled
          hint="Obrigatório"
        />

        <FieldToggle
          label="E-mail"
          checked={form.required_fields.email}
          disabled
          hint="Obrigatório"
        />

        <FieldToggle
          label="Telefone"
          checked={form.required_fields.phone}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              required_fields: { ...f.required_fields, phone: v },
            }))
          }
          hint="Opcional"
        />

        <FieldToggle
          label="CPF/CNPJ"
          checked={form.required_fields.cpf}
          onChange={(v) =>
            setForm((f) => ({
              ...f,
              required_fields: { ...f.required_fields, cpf: v },
            }))
          }
          hint="Opcional"
        />
      </div>
    </section>
  );
}
