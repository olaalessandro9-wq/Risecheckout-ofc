import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAffiliationDetails } from "@/hooks/useAffiliationDetails";
import { AffiliationHeader } from "@/components/affiliation/AffiliationHeader";
import { AffiliationSidebar, AffiliationTab } from "@/components/affiliation/AffiliationSidebar";
import { OffersTab } from "@/components/affiliation/tabs/OffersTab";
import { GatewaysTab } from "@/components/affiliation/tabs/GatewaysTab";
import { PixelsTab } from "@/components/affiliation/tabs/pixels";
import { DetailsTab } from "@/components/affiliation/tabs/DetailsTab";
import { OtherProductsTab } from "@/components/affiliation/tabs/OtherProductsTab";

export default function AffiliationDetails() {
  const { affiliationId } = useParams<{ affiliationId: string }>();
  const { affiliation, otherProducts, isLoading, error, refetch } = useAffiliationDetails(affiliationId);
  const [activeTab, setActiveTab] = useState<AffiliationTab>("offers");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !affiliation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar afiliação</h2>
        <p className="text-muted-foreground text-center">
          {error || "Afiliação não encontrada"}
        </p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "offers":
        return <OffersTab affiliation={affiliation} />;
      case "gateways":
        return <GatewaysTab affiliation={affiliation} onRefetch={refetch} />;
      case "pixels":
        return (
          <PixelsTab
            affiliationId={affiliation.id}
            initialPixels={affiliation.pixels}
            onRefetch={refetch}
          />
        );
      case "details":
        return <DetailsTab affiliation={affiliation} onRefetch={refetch} />;
      case "other-products":
        return (
          <OtherProductsTab
            products={otherProducts}
            producerName={affiliation.producer?.name || null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <AffiliationHeader affiliation={affiliation} />

      {/* Conteúdo Principal */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <AffiliationSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasOtherProducts={otherProducts.length > 0}
        />

        {/* Conteúdo da Tab */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
