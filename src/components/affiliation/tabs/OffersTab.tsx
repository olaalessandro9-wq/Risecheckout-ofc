import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, AlertCircle, XCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AffiliationDetails } from "@/hooks/useAffiliationDetails";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { api } from "@/lib/api";

import { createLogger } from "@/lib/logger";

const log = createLogger("OffersTab");

interface OffersTabProps {
  affiliation: AffiliationDetails;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function OffersTab({ affiliation }: OffersTabProps) {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { offers, checkouts, affiliate_code, commission_rate, status } = affiliation;
  const isCancelled = status === "cancelled";
  const isActive = status === "active";
  
  const [userHasGateway, setUserHasGateway] = useState<boolean | null>(null);
  const [loadingGateway, setLoadingGateway] = useState(true);

  // Verificar se usuário tem gateway configurado
  useEffect(() => {
    const checkUserGateway = async () => {
      if (!user?.id) {
        setUserHasGateway(false);
        setLoadingGateway(false);
        return;
      }

      try {
        const { data, error } = await api.call<{ hasPaymentAccount?: boolean }>("admin-data", {
          action: "user-gateway-status",
        });

        if (error) throw error;

        setUserHasGateway(data?.hasPaymentAccount || false);
      } catch (err) {
        log.error("Erro ao verificar gateway:", err);
        setUserHasGateway(false);
      } finally {
        setLoadingGateway(false);
      }
    };

    checkUserGateway();
  }, [user?.id]);

  const getAffiliateLink = (paymentLinkSlug: string | null) => {
    if (!paymentLinkSlug) return null;
    return `https://risecheckout.com/pay/${paymentLinkSlug}?ref=${affiliate_code}`;
  };

  const copyLink = (link: string | null) => {
    if (!link) {
      toast.error("Link não disponível");
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  // Encontrar checkout padrão
  const defaultCheckout = checkouts.find(c => c.is_default) || checkouts[0];

  // Determinar se pode mostrar o link
  const canShowLink = isActive && userHasGateway;

  if (offers.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma oferta disponível</h3>
        <p className="text-muted-foreground">
          Este produto ainda não possui ofertas ativas para divulgação.
        </p>
      </div>
    );
  }

  // Renderizar mensagem baseada no status da afiliação
  const renderStatusMessage = () => {
    if (status === "pending") {
      return (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-700 dark:text-amber-400">Afiliação em análise</h3>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Aguarde a aprovação do produtor para acessar seu link de afiliado.
            </p>
          </div>
        </div>
      );
    }
    
    if (status === "rejected") {
      return (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Afiliação recusada</h3>
            <p className="text-sm text-muted-foreground">
              Sua solicitação de afiliação foi recusada pelo produtor.
            </p>
          </div>
        </div>
      );
    }
    
    if (status === "blocked") {
      return (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Afiliação bloqueada</h3>
            <p className="text-sm text-muted-foreground">
              Você foi bloqueado e não pode mais promover este produto.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Link Principal ou Mensagens de Status */}
      <div className="bg-card border rounded-lg p-4">
        {isCancelled ? (
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Afiliação Cancelada</h3>
              <p className="text-sm text-muted-foreground">
                Você não pode mais promover este produto.
              </p>
            </div>
          </div>
        ) : !isActive ? (
          renderStatusMessage()
        ) : loadingGateway ? (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando configurações...</span>
          </div>
        ) : !userHasGateway ? (
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                Configure suas formas de recebimento
              </h3>
              <p className="text-sm text-muted-foreground">
                Para ver seu link de afiliado, configure pelo menos uma forma de pagamento no menu Financeiro.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/financeiro")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
          </div>
        ) : defaultCheckout?.payment_link_slug ? (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Seu Link de Afiliado</h3>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {getAffiliateLink(defaultCheckout.payment_link_slug)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => copyLink(getAffiliateLink(defaultCheckout.payment_link_slug))}
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(getAffiliateLink(defaultCheckout.payment_link_slug) || '', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nenhum link disponível</p>
        )}
      </div>

      {/* Tabela de Ofertas */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Ofertas Disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            Todas as ofertas deste produto que você pode promover
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Oferta</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Sua Comissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => {
              const commission = (offer.price * commission_rate) / 100;
              // Usar link específico da oferta, fallback para checkout padrão
              const fallbackSlug = (checkouts.find(c => c.is_default) || checkouts[0])?.payment_link_slug;
              const link = getAffiliateLink(offer.payment_link_slug || fallbackSlug || null);

              return (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {offer.name}
                      {offer.is_default && (
                        <Badge variant="secondary" className="text-xs">Principal</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(offer.price)}</TableCell>
                  <TableCell>
                    <span className="text-success-foreground font-semibold">
                      {formatCurrency(commission)}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({commission_rate}%)
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {offer.status === 'active' ? 'Ativa' : offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => copyLink(link)}
                      disabled={!link || !canShowLink}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Link
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
