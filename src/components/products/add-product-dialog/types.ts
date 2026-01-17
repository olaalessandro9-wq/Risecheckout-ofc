/**
 * Tipos do AddProductDialog
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  description: z.string().trim().max(2000, { message: "Descrição muito longa" }).optional(),
  price: z.number().int().positive({ message: "Preço deve ser maior que R$ 0,00" }),
});

export const deliveryUrlSchema = z.string()
  .min(1, { message: "O link de entrega é obrigatório" })
  .url({ message: "Link inválido. Insira uma URL válida." })
  .startsWith("https://", { message: "O link deve começar com https://" });

export interface AddProductFormData {
  name: string;
  description: string;
  price: number;
  delivery_url: string;
}

export interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}
