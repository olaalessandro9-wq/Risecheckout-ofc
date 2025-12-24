import { Offer } from "@/hooks/useAffiliationProduct";

interface AffiliationOfferTableProps {
  offers: Offer[];
  commissionRate: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Tabela de ofertas disponíveis para afiliação, mostrando
 * preço e comissão calculada.
 */
export function AffiliationOfferTable({ offers, commissionRate }: AffiliationOfferTableProps) {
  const calculateCommission = (price: number) => {
    return (price * commissionRate) / 100;
  };

  if (offers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma oferta adicional disponível no momento.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-semibold text-sm">Nome</th>
            <th className="text-left py-3 px-2 font-semibold text-sm">Preço</th>
            <th className="text-left py-3 px-2 font-semibold text-sm">Você recebe</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id} className="border-b last:border-0">
              <td className="py-3 px-2 text-sm">{offer.name}</td>
              <td className="py-3 px-2 text-sm">{formatCurrency(offer.price)}</td>
              <td className="py-3 px-2 text-sm text-primary font-medium">
                {formatCurrency(calculateCommission(offer.price))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
