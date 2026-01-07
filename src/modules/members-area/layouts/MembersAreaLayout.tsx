/**
 * MembersAreaLayout - Layout dedicado da Área de Membros (Estilo Cakto)
 * 
 * Renderiza a seção completa com header visual, navegação interna e conteúdo
 * Suporta modo de edição de conteúdo dedicado
 */

import { useSearchParams } from "react-router-dom";
import { useProductContext } from "@/modules/products/context/ProductContext";
import { useMembersArea } from "@/hooks/useMembersArea";
import { Loader2 } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { MembersAreaCover } from "../components/MembersAreaCover";
import { MembersAreaActions } from "../components/MembersAreaActions";
import { MembersAreaNavTabs } from "../components/MembersAreaNavTabs";
import { ContentTab } from "../views/ContentTab";
import { ContentEditorView } from "../views/ContentEditorView";
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
  const contentMode = searchParams.get("mode"); // "new" or "edit"

  const handleTabChange = (tab: MembersAreaTabType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    // Clear content editor params when changing tabs
    newParams.delete("mode");
    newParams.delete("contentId");
    newParams.delete("moduleId");
    setSearchParams(newParams);
  };

  const handleBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("section");
    newParams.delete("tab");
    newParams.delete("mode");
    newParams.delete("contentId");
    newParams.delete("moduleId");
    setSearchParams(newParams);
  };

  const handleContentEditorBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("mode");
    newParams.delete("contentId");
    newParams.delete("moduleId");
    setSearchParams(newParams);
  };

  const handleContentEditorSave = async () => {
    // Refetch modules data to show the new content immediately
    await membersAreaData.fetchModules();
    handleContentEditorBack();
  };

  if (membersAreaData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check if we're in content editor mode
  const isContentEditorMode = contentMode === "new" || contentMode === "edit";

  // Render content editor if in edit mode
  if (isContentEditorMode) {
    return (
      <ContentEditorView
        productId={product?.id}
        onBack={handleContentEditorBack}
        onSave={handleContentEditorSave}
      />
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
            <ContentTab membersAreaData={membersAreaData} productId={product?.id} />
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
