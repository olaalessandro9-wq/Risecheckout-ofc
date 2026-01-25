import { z } from "zod";

export const couponSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome do cupom é obrigatório").max(100, "Nome muito longo"),
  code: z
    .string()
    .min(3, "Código deve ter pelo menos 3 caracteres")
    .max(50, "Código muito longo (máximo 50)")
    .transform((val) => val.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '')),
  description: z.string().max(500, "Descrição muito longa").optional(),
  discountType: z.literal("percentage").default("percentage"),
  discountValue: z.preprocess(
    (val) => {
      // Permite o usuário limpar/editar livremente no input.
      // Campo vazio vira 0 para disparar a validação "maior que 0" apenas na validação/salvar.
      if (val === "" || val === null || val === undefined) return 0;

      if (typeof val === "string") {
        const normalized = val.replace(",", ".");
        const n = Number(normalized);
        return Number.isNaN(n) ? val : n;
      }

      return val;
    },
    z.number({ invalid_type_error: "Valor inválido" }),
  ),
  hasExpiration: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  maxUses: z.preprocess(
    (val) => {
      // Vazio, null, undefined ou 0 = ilimitado
      if (val === "" || val === null || val === undefined || val === 0) return null;
      if (typeof val === "string") {
        const parsed = val.trim();
        if (parsed === "" || parsed === "0") return null;
        const n = Number(parsed);
        return Number.isNaN(n) ? null : n;
      }
      return val;
    },
    z.union([
      z.null(),
      z.number().min(1, "Limite deve ser maior que 0")
    ])
  ),
  maxUsesPerCustomer: z.preprocess(
    (val) => {
      // Vazio, null, undefined ou 0 = ilimitado
      if (val === "" || val === null || val === undefined || val === 0) return null;
      if (typeof val === "string") {
        const parsed = val.trim();
        if (parsed === "" || parsed === "0") return null;
        const n = Number(parsed);
        return Number.isNaN(n) ? null : n;
      }
      return val;
    },
    z.union([
      z.null(),
      z.number().min(1, "Limite deve ser maior que 0")
    ])
  ),
  applyToOrderBumps: z.boolean().default(true),
  usageCount: z.number().optional(),
}).refine(
  (data) => {
    // Validação: valor mínimo é 1
    if (data.discountValue < 1) return false;
    return true;
  },
  {
    message: "O valor deve ser maior que 0",
    path: ["discountValue"],
  }
).refine(
  (data) => {
    // Validação: porcentagem deve ser no máximo 99
    if (data.discountValue !== undefined && data.discountValue > 99) {
      return false;
    }
    return true;
  },
  {
    message: "O valor máximo é 99%",
    path: ["discountValue"],
  }
).refine(
  (data) => {
    // Validação: se tem expiração, precisa ter data de início
    if (data.hasExpiration && !data.startDate) {
      return false;
    }
    return true;
  },
  {
    message: "Selecione a data de início",
    path: ["startDate"],
  }
).refine(
  (data) => {
    // Validação: se tem expiração, precisa ter data de fim
    if (data.hasExpiration && !data.endDate) {
      return false;
    }
    return true;
  },
  {
    message: "Selecione a data de fim",
    path: ["endDate"],
  }
).refine(
  (data) => {
    // Validação: data fim não pode ser antes da data início
    if (data.hasExpiration && data.startDate && data.endDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  },
  {
    message: "Data fim deve ser após a data início",
    path: ["endDate"],
  }
);

export type CouponFormData = z.infer<typeof couponSchema>;

// Valores padrão para o formulário
export const defaultCouponValues: Partial<CouponFormData> = {
  name: "",
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: undefined,
  hasExpiration: false,
  maxUses: null,
  maxUsesPerCustomer: null,
  startDate: undefined,
  endDate: undefined,
  applyToOrderBumps: true,
};
