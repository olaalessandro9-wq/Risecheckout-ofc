import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Package, Link as LinkIcon, Mail, Webhook } from "lucide-react";

const productSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  description: z.string().trim().max(2000, { message: "Descrição muito longa" }).optional(),
  price: z.number().int().positive({ message: "Preço deve ser maior que R$ 0,00" }),
});

const deliveryUrlSchema = z.string()
  .min(1, { message: "O link de entrega é obrigatório" })
  .url({ message: "Link inválido. Insira uma URL válida." })
  .startsWith("https://", { message: "O link deve começar com https://" });

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [deliveryUrlError, setDeliveryUrlError] = useState("");
  const [externalDelivery, setExternalDelivery] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    delivery_url: "",
  });

  const validateDeliveryUrl = (url: string): boolean => {
    // Se entrega externa, não precisa validar URL
    if (externalDelivery) {
      setDeliveryUrlError("");
      return true;
    }
    
    const result = deliveryUrlSchema.safeParse(url);
    if (!result.success) {
      setDeliveryUrlError(result.error.errors[0].message);
      return false;
    }
    
    setDeliveryUrlError("");
    return true;
  };

  const handleContinue = () => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      if (formData.price <= 0) {
        toast.error("O preço deve ser maior que R$ 0,00");
      }
      return;
    }
    
    const validation = productSchema.safeParse({ 
      name: formData.name, 
      description: formData.description, 
      price: formData.price 
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setDeliveryUrlError("");
  };

  const handleSubmit = async () => {
    // Validar URL somente se entrega interna
    if (!externalDelivery && !validateDeliveryUrl(formData.delivery_url)) {
      return;
    }
    
    // Get session token from localStorage
    const sessionToken = localStorage.getItem("rise_producer_token");
    if (!sessionToken) {
      toast.error("Você precisa estar autenticado. Faça login novamente.");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("product-management/create", {
        body: {
          sessionToken,
          product: {
            name: formData.name.trim(),
            description: formData.description.trim() || "",
            price: formData.price,
            delivery_url: externalDelivery ? null : (formData.delivery_url.trim() || null),
            external_delivery: externalDelivery,
          },
        },
      });

      if (error) {
        console.error("[AddProductDialog] Edge function error:", error);
        throw new Error(error.message || "Erro ao criar produto");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao criar produto");
      }

      toast.success("Produto criado com sucesso!");
      onOpenChange(false);
      setFormData({ name: "", description: "", price: 0, delivery_url: "" });
      setExternalDelivery(false);
      setStep(1);
      
      if (onProductAdded) onProductAdded();
      
      navigate(`/dashboard/produtos/editar?id=${data.product.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar produto");
      console.error("[AddProductDialog] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({ name: "", description: "", price: 0, delivery_url: "" });
    setExternalDelivery(false);
    setStep(1);
    setDeliveryUrlError("");
  };

  const handleDeliveryTypeChange = (external: boolean) => {
    setExternalDelivery(external);
    if (external) {
      setFormData({ ...formData, delivery_url: "" });
      setDeliveryUrlError("");
    }
  };

  const handleDeliveryUrlChange = (value: string) => {
    setFormData({ ...formData, delivery_url: value });
    if (deliveryUrlError) {
      validateDeliveryUrl(value);
    }
  };

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
                Link de Entrega
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
        
        {step === 1 ? (
          // STEP 1: Dados básicos do produto
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border text-foreground"
                placeholder="Digite o nome do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-border text-foreground min-h-[100px]"
                placeholder="Digite a descrição do produto"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.description.length}/100
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-foreground">Preço</Label>
              <CurrencyInput
                id="price"
                value={formData.price}
                onChange={(newValue) => setFormData({ ...formData, price: newValue })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        ) : (
          // STEP 2: Link de entrega
          <div className="space-y-4 py-4">
            {/* Seletor de tipo de entrega */}
            <div className="space-y-3">
              <Label className="text-foreground">Como será a entrega deste produto?</Label>
              <div className="grid grid-cols-1 gap-3">
                {/* Opção: Entrega Interna */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange(false)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    !externalDelivery 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${!externalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Mail className={`h-5 w-5 ${!externalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!externalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Entrega Interna
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rise envia email com link de acesso ao cliente automaticamente
                    </p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    !externalDelivery ? 'border-primary' : 'border-muted-foreground/50'
                  }`}>
                    {!externalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </button>

                {/* Opção: Entrega Externa */}
                <button
                  type="button"
                  onClick={() => handleDeliveryTypeChange(true)}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    externalDelivery 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${externalDelivery ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Webhook className={`h-5 w-5 ${externalDelivery ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${externalDelivery ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Entrega Externa
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meu sistema faz a entrega (webhook, N8N, automação)
                    </p>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    externalDelivery ? 'border-primary' : 'border-muted-foreground/50'
                  }`}>
                    {externalDelivery && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Conteúdo condicional */}
            {externalDelivery ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Webhook className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Entrega Externa</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O Rise <strong>não enviará</strong> email de confirmação para este produto.
                      Configure webhooks após criar o produto para receber notificações de venda.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="delivery_url" className="text-foreground">
                  Link de acesso ao produto
                </Label>
                <Input
                  id="delivery_url"
                  type="url"
                  value={formData.delivery_url}
                  onChange={(e) => handleDeliveryUrlChange(e.target.value)}
                  onBlur={() => validateDeliveryUrl(formData.delivery_url)}
                  className={`bg-background border-border text-foreground ${deliveryUrlError ? 'border-destructive' : ''}`}
                  placeholder="https://exemplo.com/seu-produto"
                />
                {deliveryUrlError ? (
                  <p className="text-xs text-destructive">{deliveryUrlError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Este link será enviado por email após confirmação do pagamento.
                  </p>
                )}
              </div>
            )}

            {/* Resumo */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-foreground">
                <strong>Resumo:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Produto:</strong> {formData.name}</li>
                <li>• <strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.price / 100)}</li>
                <li>• <strong>Entrega:</strong> {externalDelivery ? 'Externa (seu sistema)' : 'Interna (Rise envia email)'}</li>
                {!externalDelivery && formData.delivery_url && (
                  <li>• <strong>Link:</strong> {formData.delivery_url.length > 40 ? formData.delivery_url.substring(0, 40) + '...' : formData.delivery_url}</li>
                )}
              </ul>
            </div>
          </div>
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
                disabled={loading || (!externalDelivery && !!deliveryUrlError)}
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
