import { useState } from "react";
import { TrendingUp, Webhook, BarChart3 } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { UTMifyConfig } from "@/components/integrations/UTMifyConfig";
import { WebhooksConfig } from "@/components/webhooks/WebhooksConfig";
import { PixelsProvider, PixelLibrary } from "@/modules/pixels";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type IntegrationType = "pixels" | "utmify" | "webhooks" | null;

const Integracoes = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType>(null);

  const integrations = [
    {
      id: "pixels" as IntegrationType,
      name: "Pixels de Rastreamento",
      icon: BarChart3,
      iconColor: "#f97316",
      description: "Facebook, TikTok, Google Ads e Kwai",
    },
    {
      id: "utmify" as IntegrationType,
      name: "UTMify",
      icon: TrendingUp,
      iconColor: "#3b82f6",
      description: "Rastreamento de conversões com parâmetros UTM",
    },
    {
      id: "webhooks" as IntegrationType,
      name: "Webhooks",
      icon: Webhook,
      iconColor: "#8b5cf6",
      description: "Configure as integrações com os seus apps",
    },
  ];

  const renderIntegrationContent = () => {
    switch (selectedIntegration) {
      case "pixels":
        return (
          <PixelsProvider>
            <PixelLibrary />
          </PixelsProvider>
        );
      case "utmify":
        return <UTMifyConfig />;
      case "webhooks":
        return <WebhooksConfig />;
      default:
        return null;
    }
  };

  const getIntegrationTitle = () => {
    const integration = integrations.find(i => i.id === selectedIntegration);
    return integration?.name || "";
  };

  const getIntegrationDescription = () => {
    const integration = integrations.find(i => i.id === selectedIntegration);
    return integration?.description || "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Integrações
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure suas integrações com serviços externos
        </p>
      </div>

      <div className="max-w-2xl space-y-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            icon={integration.icon}
            iconColor={integration.iconColor}
            onClick={() => setSelectedIntegration(integration.id)}
          />
        ))}
      </div>

      {/* Sheet lateral para configuração */}
      <Sheet 
        open={selectedIntegration !== null} 
        onOpenChange={(open) => !open && setSelectedIntegration(null)}
      >
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{getIntegrationTitle()}</SheetTitle>
            <SheetDescription>
              {getIntegrationDescription()}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {renderIntegrationContent()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Integracoes;
