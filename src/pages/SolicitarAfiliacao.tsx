import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Hooks extraídos
import { usePaymentAccountCheck } from "@/hooks/usePaymentAccountCheck";
import { useAffiliationProduct } from "@/hooks/useAffiliationProduct";

// Componentes extraídos
import { PaymentAccountAlert } from "@/components/affiliation/PaymentAccountAlert";
import { AffiliationOfferTable } from "@/components/affiliation/AffiliationOfferTable";
import { AffiliationDetailsTab } from "@/components/affiliation/AffiliationDetailsTab";

export default function SolicitarAfiliacao() {
  const { product_id } = useParams<{ product_id: string }>();
  const navigate = useNavigate();
  
  // Hooks
  const { hasPaymentAccount } = usePaymentAccountCheck();
  const { product, offers, isLoading, error } = useAffiliationProduct(product_id);
  
  // Estado local
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequest = async () => {
    try {
      setRequesting(true);
      setRequestError(null);

      // Chamar Edge Function request-affiliation
      const { data, error: fnError } = await supabase.functions.invoke("request-affiliation", {
        body: { product_id },
      });

      if (fnError) {
        console.error("Erro na Edge Function:", fnError);
        throw new Error(fnError.message || "Erro ao processar solicitação");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro desconhecido ao solicitar afiliação");
      }

      setSuccess(true);
      toast.success(data.message);
    } catch (err: unknown) {
      console.error("Erro ao solicitar afiliação:", err);
      const errorMessage = err instanceof Error ? err.message : "Não foi possível processar sua solicitação. Tente novamente.";
      setRequestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRequesting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || requestError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Erro</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error || requestError}</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <CardTitle>Solicitação Enviada!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {product?.affiliate_settings.requireApproval
                ? "Sua solicitação foi enviada com sucesso! Aguarde a aprovação do produtor para começar a divulgar."
                : "Parabéns! Você já é um afiliado ativo. Redirecionando para seu painel..."}
            </p>
            <Button onClick={() => navigate("/dashboard/minhas-afiliacoes")} className="w-full">
              Ir para Minhas Afiliações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Programa de Afiliados</h1>
          <p className="text-muted-foreground">Ganhe comissões divulgando este produto</p>
        </div>

        {/* Alert: Conta de pagamento não conectada */}
        {hasPaymentAccount === false && <PaymentAccountAlert />}

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            {/* Product Header */}
            <div className="flex items-start gap-4 mb-6">
              {product?.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{product?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Torne-se um afiliado e comece a ganhar comissões por cada venda realizada através do seu link.
                </p>
              </div>
              <Button
                onClick={handleRequest}
                disabled={requesting || hasPaymentAccount === false}
                size="lg"
                title={hasPaymentAccount === false ? "Conecte uma conta de pagamento primeiro" : ""}
              >
                {requesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Solicitar Afiliação
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="produto" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="produto">Produto</TabsTrigger>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
              </TabsList>

              {/* Aba Produto */}
              <TabsContent value="produto" className="space-y-4 mt-6">
                <div>
                  <h3 className="font-semibold mb-1">Tipo</h3>
                  <p className="text-sm text-muted-foreground">Venda única</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Comissão</h3>
                  <p className="text-sm text-primary font-medium">
                    {product?.affiliate_settings.defaultRate}%
                  </p>
                </div>
              </TabsContent>

              {/* Aba Detalhes */}
              <TabsContent value="detalhes" className="mt-6">
                {product && <AffiliationDetailsTab settings={product.affiliate_settings} />}
              </TabsContent>

              {/* Aba Ofertas */}
              <TabsContent value="ofertas" className="mt-6">
                <AffiliationOfferTable
                  offers={offers}
                  commissionRate={product?.affiliate_settings.defaultRate || 50}
                />
              </TabsContent>
            </Tabs>

            {/* Alert de Aprovação Manual */}
            {product?.affiliate_settings.requireApproval && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Aprovação Manual
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Este produto exige aprovação do produtor antes de você começar a divulgar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
