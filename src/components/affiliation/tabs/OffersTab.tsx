import { Copy, ExternalLink, AlertCircle, XCircle } from "lucide-react";
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
  const { offers, checkouts, affiliate_code, commission_rate, status } = affiliation;
  const isCancelled = status === "cancelled";

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

  return (
    <div className="space-y-6">
      {/* Link Principal ou Mensagem de Cancelamento */}
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
              const checkout = checkouts.find(c => c.is_default) || checkouts[0];
              const link = getAffiliateLink(checkout?.payment_link_slug || null);

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
                    <span className="text-green-600 font-semibold">
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
                      disabled={!link || isCancelled}
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
