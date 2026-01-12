import { useState } from "react";
import { TrendingUp, Webhook, TestTube2, BarChart3 } from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { UTMifyConfig } from "@/components/integrations/UTMifyConfig";
import { WebhooksConfig } from "@/components/webhooks/WebhooksConfig";
import { TestModeConfig } from "@/components/integrations/TestModeConfig";
import { PixelLibrary } from "@/components/pixels";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type IntegrationType = "pixels" | "utmify" | "webhooks" | "testmode" | null;

const Integracoes = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationType>(null);

  const pixelSection = {
    id: "pixels" as IntegrationType,
    name: "Gerenciar Pixels",
    icon: BarChart3,
    iconColor: "#10b981",
    description: "Cadastre e gerencie seus pixels de rastreamento (Facebook, TikTok, Google Ads, Kwai)",
  };

  const integrations = [
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
    {
      id: "testmode" as IntegrationType,
      name: "Modo Teste",
      icon: TestTube2,
      iconColor: "#f59e0b",
      description: "Use credenciais de teste do Mercado Pago para desenvolvimento",
    },
  ];

  const renderIntegrationContent = () => {
    switch (selectedIntegration) {
      case "pixels":
        return <PixelLibrary />;
      case "utmify":
        return <UTMifyConfig />;
      case "webhooks":
        return <WebhooksConfig />;
      case "testmode":
        return <TestModeConfig />;
      default:
        return null;
    }
  };

  const getIntegrationTitle = () => {
    if (selectedIntegration === "pixels") return pixelSection.name;
    const integration = integrations.find(i => i.id === selectedIntegration);
    return integration?.name || "";
  };

  const getIntegrationDescription = () => {
    if (selectedIntegration === "pixels") return pixelSection.description;
    const integration = integrations.find(i => i.id === selectedIntegration);
    return integration?.description || "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-white">
          Integrações
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          Configure suas integrações com serviços externos
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Seção: Pixels de Rastreamento */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            📊 Pixels de Rastreamento
          </h2>
          <IntegrationCard
            name={pixelSection.name}
            icon={pixelSection.icon}
            iconColor={pixelSection.iconColor}
            onClick={() => setSelectedIntegration(pixelSection.id)}
          />
        </div>

        {/* Seção: Outras Integrações */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            🔗 Outras Integrações
          </h2>
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
      </div>

      {/* Sheet lateral para configuração */}
      <Sheet 
        open={selectedIntegration !== null} 
        onOpenChange={(open) => !open && setSelectedIntegration(null)}
      >
        <SheetContent className={selectedIntegration === "pixels" ? "sm:max-w-[700px] overflow-y-auto" : "sm:max-w-[600px] overflow-y-auto"}>
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
