import { AffiliateSettings } from "@/hooks/useAffiliationProduct";

interface AffiliationDetailsTabProps {
  settings: AffiliateSettings;
}

/**
 * Conteúdo da aba "Detalhes" na página de afiliação,
 * exibindo informações sobre atribuição, cookies, etc.
 */
export function AffiliationDetailsTab({ settings }: AffiliationDetailsTabProps) {
  const getAttributionLabel = (model: string) => {
    switch (model) {
      case "first_click":
        return "Primeiro clique";
      case "last_click":
      default:
        return "Último clique";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Atribuição</h3>
        <p className="text-sm text-muted-foreground">
          {getAttributionLabel(settings.attributionModel)}
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Duração dos cookies</h3>
        <p className="text-sm text-muted-foreground">
          {settings.cookieDuration} dias
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Recebe Order Bump</h3>
        <p className="text-sm text-muted-foreground">
          {(settings.commissionOnOrderBump ?? settings.allowUpsells) ? "Sim" : "Não"}
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Recebe Upsell</h3>
        <p className="text-sm text-muted-foreground">
          {(settings.commissionOnUpsell ?? settings.allowUpsells) ? "Sim" : "Não"}
        </p>
      </div>

      {settings.supportEmail && (
        <div>
          <h3 className="font-semibold mb-1">E-mail de suporte para afiliados</h3>
          <a
            href={`mailto:${settings.supportEmail}`}
            className="text-sm text-primary hover:underline"
          >
            {settings.supportEmail}
          </a>
        </div>
      )}
    </div>
  );
}
