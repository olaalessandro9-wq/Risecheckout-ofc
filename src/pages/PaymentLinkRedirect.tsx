/**
 * PaymentLinkRedirect
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 * 
 * Esta página processa links de pagamento no formato /c/:slug
 * e redireciona para o checkout apropriado.
 * 
 * Fluxo:
 * 1. Recebe slug do link de pagamento
 * 2. Busca o link via Edge Function
 * 3. Verifica se o link está ativo
 * 4. Verifica se o produto está ativo
 * 5. Redireciona para /pay/:slug (usando o slug do payment_link)
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { createLogger } from "@/lib/logger";

const log = createLogger("PaymentLinkRedirect");

// Interface para tipagem do linkData retornado
interface PaymentLinkWithOffers {
  id: string;
  slug: string;
  status: string | null;
  offers?: {
    id: string;
    product_id: string;
    products?: {
      id: string;
      status: string | null;
      support_email: string | null;
    } | null;
  } | null;
}

const PaymentLinkRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    log.debug("v3.0 MIGRATED - slug:", slug);
    
    const processPaymentLink = async () => {
      if (!slug) {
        setError("Link inválido");
        return;
      }

      try {
        const { data, error: fetchError } = await api.call<{
          success?: boolean;
          data?: PaymentLinkWithOffers;
        }>("checkout-public-data", {
          action: "payment-link-data",
          slug,
        });

        if (fetchError) {
          log.error("Erro ao buscar link", fetchError);
          navigate(`/pay/${slug}?build=v3_0`, { replace: true });
          return;
        }

        if (!data?.success || !data?.data) {
          log.error("Link não encontrado");
          navigate(`/pay/${slug}?build=v3_0`, { replace: true });
          return;
        }

        log.debug("Link encontrado", data.data);
        
        const typedLinkData = data.data;

        if (typedLinkData.status === "inactive") {
          log.debug("Link desativado");
          setIsInactive(true);
          setError("Produto não disponível, inativo ou bloqueado. Contate o suporte para mais informações.");
          return;
        }

        const product = typedLinkData.offers?.products;
        if (product && product.status === "blocked") {
          log.debug("Produto bloqueado");
          setIsInactive(true);
          setError("Produto não disponível, inativo ou bloqueado. Contate o suporte para mais informações.");
          return;
        }

        navigate(`/pay/${typedLinkData.slug}?build=v3_0`, { replace: true });
      } catch (err) {
        log.error("Erro ao processar link", err);
        navigate(`/pay/${slug}?build=v3_0`, { replace: true });
        return;
      }
    };

    processPaymentLink();
  }, [slug, navigate]);

  if (error) {
    // Página de erro para link inativo/bloqueado (estilo Cakto)
    if (isInactive) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto p-6">
            {/* Logo da plataforma */}
            <div className="mb-8">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                </svg>
              </div>
            </div>
            
            {/* Mensagem de erro */}
            <p className="text-base text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      );
    }

    // Página de erro genérica
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Oops! Algo deu errado
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Processando seu link de pagamento...
        </p>
      </div>
    </div>
  );
};

export default PaymentLinkRedirect;
