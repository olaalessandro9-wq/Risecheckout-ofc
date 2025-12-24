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
import { ensureSingleCheckout } from "@/lib/products/ensureSingleCheckout";

const productSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  description: z.string().trim().max(2000, { message: "Descrição muito longa" }).optional(),
  price: z.number().int().positive({ message: "Preço deve ser maior que R$ 0,00" }),
});

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: () => void;
}

export function AddProductDialog({ open, onOpenChange, onProductAdded }: AddProductDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,  // Centavos
  });

  const handleContinue = async () => {
    if (!formData.name || !formData.description || formData.price <= 0 || !user) {
      if (formData.price <= 0) {
        toast.error("O preço deve ser maior que R$ 0,00");
      }
      return;
    }
    
    setLoading(true);
    try {
      const validation = productSchema.safeParse({ 
        name: formData.name, 
        description: formData.description, 
        price: formData.price 
      });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: validation.data.name,
          description: validation.data.description || "",
          price: validation.data.price,  // Já está em centavos
          user_id: user.id,
          status: "active",
          support_name: "",
          support_email: "",
        })
        .select()
        .single();

      if (error) throw error;

      // O trigger create_default_checkout já cria o checkout automaticamente
      
      toast.success("Produto criado com sucesso!");
      onOpenChange(false);
      setFormData({ name: "", description: "", price: 0 });
      
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
    setFormData({ name: "", description: "", price: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Produto</DialogTitle>
        </DialogHeader>
        
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

        <div className="flex justify-end gap-2">
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
            disabled={!formData.name || !formData.description || formData.price <= 0 || loading}
          >
            {loading ? "Criando..." : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
