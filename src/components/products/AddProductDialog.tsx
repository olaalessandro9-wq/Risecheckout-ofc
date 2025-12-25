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
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Package, Link as LinkIcon } from "lucide-react";

const productSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  description: z.string().trim().max(2000, { message: "Descrição muito longa" }).optional(),
  price: z.number().int().positive({ message: "Preço deve ser maior que R$ 0,00" }),
});

const deliveryUrlSchema = z.string()
  .url({ message: "Link inválido. Insira uma URL válida." })
  .startsWith("https://", { message: "O link deve começar com https://" })
  .optional()
  .or(z.literal(""));

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [deliveryUrlError, setDeliveryUrlError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    delivery_url: "",
  });

  const validateDeliveryUrl = (url: string): boolean => {
    if (!url) {
      setDeliveryUrlError("");
      return true; // URL é opcional
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
    if (!user) return;
    
    // Validar URL se fornecida
    if (formData.delivery_url && !validateDeliveryUrl(formData.delivery_url)) {
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || "",
          price: formData.price,
          user_id: user.id,
          status: "active",
          support_name: "",
          support_email: "",
          delivery_url: formData.delivery_url.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Produto criado com sucesso!");
      onOpenChange(false);
      setFormData({ name: "", description: "", price: 0, delivery_url: "" });
      setStep(1);
      
      if (onProductAdded) onProductAdded();
      
      navigate(`/dashboard/produtos/editar?id=${data.id}`);
    } catch (error: any) {
      toast.error("Erro ao criar produto");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({ name: "", description: "", price: 0, delivery_url: "" });
    setStep(1);
    setDeliveryUrlError("");
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
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                Link de acesso ao produto
              </h4>
              <p className="text-sm text-muted-foreground">
                Este link será enviado automaticamente para o cliente por e-mail assim que o pagamento for confirmado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_url" className="text-foreground">
                Link de entrega (opcional)
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
                  Você pode adicionar ou alterar este link depois nas configurações do produto.
                </p>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-foreground">
                <strong>Resumo:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Produto:</strong> {formData.name}</li>
                <li>• <strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.price / 100)}</li>
                {formData.delivery_url && (
                  <li>• <strong>Link de entrega:</strong> {formData.delivery_url.substring(0, 40)}...</li>
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
                disabled={loading || !!deliveryUrlError}
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
