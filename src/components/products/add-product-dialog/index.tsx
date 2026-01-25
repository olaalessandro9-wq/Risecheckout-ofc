/**
 * AddProductDialog - Componente Orquestrador
 * 
 * Dialog para adicionar novo produto com fluxo de 2 steps.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { ArrowLeft, ArrowRight, Package, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAddProduct } from "./useAddProduct";
import { StepIndicator } from "./StepIndicator";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import type { AddProductDialogProps } from "./types";

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const {
    loading,
    step,
    formData,
    deliveryType,
    deliveryUrlError,
    handleContinue,
    handleBack,
    handleSubmit,
    handleCancel,
    handleDeliveryTypeChange,
    handleDeliveryUrlChange,
    validateDeliveryUrl,
    updateFormData,
  } = useAddProduct({ onOpenChange, onProductAdded });

  // Determina se pode submeter baseado no tipo de entrega
  const canSubmit = deliveryType !== 'standard' || (formData.delivery_url && !deliveryUrlError);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {step === 1 ? (
              <>
                <Package className="h-5 w-5 text-primary" />
                Adicionar Produto
              </>
            ) : (
              <>
                <LinkIcon className="h-5 w-5 text-primary" />
                Tipo de Entrega
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />
        
        {step === 1 ? (
          <StepOne formData={formData} onUpdate={updateFormData} />
        ) : (
          <StepTwo
            formData={formData}
            deliveryType={deliveryType}
            deliveryUrlError={deliveryUrlError}
            onDeliveryTypeChange={handleDeliveryTypeChange}
            onDeliveryUrlChange={handleDeliveryUrlChange}
            onValidateUrl={validateDeliveryUrl}
          />
        )}

        <div className="flex justify-between gap-2">
          {step === 1 ? (
            <>
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="border border-border"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleContinue}
                className="bg-primary hover:bg-primary/90"
                disabled={!formData.name || !formData.description || formData.price <= 0}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="border border-border"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90"
                disabled={loading || !canSubmit}
              >
                {loading ? "Criando..." : "Cadastrar Produto"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export types
export type { AddProductDialogProps } from "./types";
