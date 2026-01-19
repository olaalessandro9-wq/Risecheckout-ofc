/**
 * EditPriceDialog - Diálogo para edição de preço de produto
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const log = createLogger("EditPriceDialog");

interface UpdatePriceResponse {
  success: boolean;
  error?: string;
}

interface EditPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  currentPrice: number; // em centavos (ex: 2990 = R$ 29,90)
  onPriceUpdated: (newPrice: number) => void;
}

export function EditPriceDialog({
  open,
  onOpenChange,
  productId,
  currentPrice,
  onPriceUpdated,
}: EditPriceDialogProps) {
  const [price, setPrice] = useState(currentPrice);
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar preço quando o dialog abrir
  useEffect(() => {
    if (open) {
      setPrice(currentPrice);
    }
  }, [open, currentPrice]);

  const handleSave = async () => {
    if (price <= 0) {
      toast.error("O preço deve ser maior que zero");
      return;
    }

    setIsSaving(true);

    try {
      log.debug("Atualizando preço do produto:", productId, "para:", price);

      // Atualizar preço via Edge Function (atomicamente atualiza produto + oferta padrão)
      const { data, error } = await api.call<UpdatePriceResponse>("product-settings", {
        action: 'update-price',
        productId,
        price,
      });

      if (error) {
        log.error("Erro na Edge Function:", error);
        throw new Error(error.message || "Erro ao atualizar preço");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao atualizar preço");
      }

      log.info("Preço atualizado com sucesso!");

      toast.success("Preço atualizado com sucesso!");
      onPriceUpdated(price);
      onOpenChange(false);
    } catch (error: unknown) {
      log.error("Erro:", error);
      toast.error(`Erro ao atualizar preço: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPrice(currentPrice);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Preço</DialogTitle>
          <DialogDescription>
            Altere o preço do produto. Esta alteração será aplicada automaticamente
            em todos os links e checkouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-price">Preço</Label>
            <CurrencyInput
              id="edit-price"
              value={price}
              onChange={setPrice}
              className="bg-background text-foreground border-border"
            />
            <p className="text-xs text-muted-foreground">
              O preço será atualizado no produto e na oferta padrão
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-success hover:bg-success/90"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
