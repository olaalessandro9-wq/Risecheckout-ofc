/**
 * MembersAreaLayout - Layout dedicado da Área de Membros (Estilo Cakto)
 * 
 * Renderiza a seção completa com header visual, navegação interna e conteúdo
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductContext } from "@/modules/products/context/ProductContext";
import { useMembersArea } from "@/hooks/useMembersArea";
import { Loader2 } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { MembersAreaCover } from "../components/MembersAreaCover";
import { MembersAreaActions } from "../components/MembersAreaActions";
import { MembersAreaNavTabs } from "../components/MembersAreaNavTabs";
import { ContentTab } from "../views/ContentTab";
import { StudentsTab } from "../views/StudentsTab";
import { GroupsTab } from "../views/GroupsTab";
import { SettingsTab } from "../views/SettingsTab";
import { BuilderTab } from "../views/BuilderTab";

export type MembersAreaTabType = "content" | "students" | "groups" | "settings" | "builder";

export function MembersAreaLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { product } = useProductContext();
  const membersAreaData = useMembersArea(product?.id);
  
  const currentTab = (searchParams.get("tab") as MembersAreaTabType) || "content";

  const handleTabChange = (tab: MembersAreaTabType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };

  const handleBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("section");
    newParams.delete("tab");
    setSearchParams(newParams);
  };

  if (membersAreaData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <BackButton onClick={handleBack} />
          <MembersAreaActions productId={product?.id} />
        </div>
      </div>

      {/* Cover Image */}
      <MembersAreaCover 
        productId={product?.id}
        coverUrl={product?.members_area_settings?.cover_url}
        productName={product?.name || "Área de Membros"}
      />

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <MembersAreaNavTabs 
          currentTab={currentTab} 
          onTabChange={handleTabChange} 
        />

        {/* Tab Content */}
        <div className="py-6">
          {currentTab === "content" && (
            <ContentTab membersAreaData={membersAreaData} />
          )}
          {currentTab === "students" && (
            <StudentsTab productId={product?.id} />
          )}
          {currentTab === "groups" && (
            <GroupsTab productId={product?.id} />
          )}
          {currentTab === "settings" && (
            <SettingsTab productId={product?.id} />
          )}
          {currentTab === "builder" && (
            <BuilderTab productId={product?.id} />
          )}
        </div>
      </div>
    </div>
  );
}
