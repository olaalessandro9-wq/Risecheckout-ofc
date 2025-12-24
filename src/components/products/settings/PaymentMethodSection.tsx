/**
 * Seção de método de pagamento padrão
 */

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/config/payment-gateways";
import type { SettingsFormProps } from "./types";

interface PaymentMethodOptionProps {
  id: string;
  label: string;
  isSelected: boolean;
}

function PaymentMethodOption({ id, label, isSelected }: PaymentMethodOptionProps) {
  return (
    <Label
      htmlFor={`pm-${id}`}
      className={cn(
        "border rounded-lg p-4 cursor-pointer flex items-center gap-3 transition-all",
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <RadioGroupItem id={`pm-${id}`} value={id} />
      {label}
    </Label>
  );
}

export function PaymentMethodSection({ form, setForm }: SettingsFormProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium">Método de pagamento padrão</h3>
      <RadioGroup
        value={form.default_payment_method}
        onValueChange={(v) =>
          setForm((f) => ({ ...f, default_payment_method: v as PaymentMethod }))
        }
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <PaymentMethodOption
          id="pix"
          label="Pix"
          isSelected={form.default_payment_method === "pix"}
        />
        <PaymentMethodOption
          id="credit_card"
          label="Cartão de crédito"
          isSelected={form.default_payment_method === "credit_card"}
        />
      </RadioGroup>
    </section>
  );
}
