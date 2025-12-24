import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Clock, MousePointer, Gift, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AffiliationDetails } from "@/hooks/useAffiliationDetails";

interface DetailsTabProps {
  affiliation: AffiliationDetails;
  onRefetch: () => Promise<void>;
}

export function DetailsTab({ affiliation, onRefetch }: DetailsTabProps) {
  const navigate = useNavigate();
  const [isDeactivating, setIsDeactivating] = useState(false);

  const product = affiliation.product;
  const settings = product?.affiliate_settings || {};

  const getAttributionLabel = (model: string | undefined) => {
    switch (model) {
      case "last_click":
        return "Último clique";
      case "first_click":
        return "Primeiro clique";
      default:
        return "Último clique";
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ status: "inactive" })
        .eq("id", affiliation.id);

      if (error) throw error;

      toast.success("Afiliação desativada com sucesso");
      navigate("/dashboard/minhas-afiliacoes");
    } catch (err: any) {
      console.error("Erro ao desativar afiliação:", err);
      toast.error("Erro ao desativar afiliação");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do Produtor */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Informações do Programa</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Comissão</p>
                <p className="font-semibold text-lg text-green-600">{affiliation.commission_rate}%</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MousePointer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo de Atribuição</p>
                <p className="font-medium">{getAttributionLabel(settings.attributionModel)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duração do Cookie</p>
                <p className="font-medium">{settings.cookieDuration || 30} dias</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão em Order Bump</p>
                <Badge variant={settings.commissionOnOrderBump ? "default" : "secondary"}>
                  {settings.commissionOnOrderBump ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comissão em Upsell</p>
                <Badge variant={settings.commissionOnUpsell ? "default" : "secondary"}>
                  {settings.commissionOnUpsell ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>

            {settings.supportEmail && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail de Suporte</p>
                  <a 
                    href={`mailto:${settings.supportEmail}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {settings.supportEmail}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Produtor */}
      {affiliation.producer && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Produtor</h3>
          <p className="font-medium">{affiliation.producer.name}</p>
        </div>
      )}

      {/* Descrição do Produto */}
      {product?.marketplace_description && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Descrição do Produto</h3>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {product.marketplace_description}
          </p>
        </div>
      )}

      {/* Regras de Afiliação */}
      {product?.marketplace_rules && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">Regras de Divulgação</h3>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {product.marketplace_rules}
          </p>
        </div>
      )}

      {/* Botão Desativar */}
      {affiliation.status === 'active' && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-destructive">Desativar Afiliação</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ao desativar, você não receberá mais comissões por vendas deste produto.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Desativar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar Afiliação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja desativar sua afiliação com "{product?.name}"? 
                    Você não receberá mais comissões por vendas deste produto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    disabled={isDeactivating}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeactivating ? "Desativando..." : "Sim, Desativar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
