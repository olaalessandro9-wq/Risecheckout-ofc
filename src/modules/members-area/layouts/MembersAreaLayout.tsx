/**
 * MembersAreaLayout - Layout dedicado da Área de Membros (Estilo Cakto)
 * 
 * Renderiza a seção completa com header visual, navegação interna e conteúdo
 * Suporta modo de edição de conteúdo dedicado
 * 
 * RISE V3: Uses MembersAreaProvider as SSOT for all child tabs
 */

import { useSearchParams } from "react-router-dom";
import { useProductContext } from "@/modules/products/context/ProductContext";
import { Loader2 } from "lucide-react";
import { MembersAreaProvider, useMembersAreaContext } from "../context";
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

/**
 * Inner Layout - Consumes the unified context
 */
function MembersAreaLayoutInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { product } = useProductContext();
  const { membersArea, productId } = useMembersAreaContext();
  
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
    await membersArea.fetchModules();
    handleContentEditorBack();
  };

  if (membersArea.isLoading) {
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
        productId={productId}
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
          <MembersAreaActions productId={productId} />
        </div>
      </div>

      {/* Cover Header */}
      <MembersAreaCover productName={product?.name || "Área de Membros"} />

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <MembersAreaNavTabs 
          currentTab={currentTab} 
          onTabChange={handleTabChange} 
        />

        {/* Tab Content */}
        <div className="py-6">
          {currentTab === "content" && (
            <ContentTab membersAreaData={membersArea} productId={productId} />
          )}
          {currentTab === "students" && (
            <StudentsTab productId={productId} />
          )}
          {currentTab === "groups" && (
            <GroupsTab />
          )}
          {currentTab === "settings" && (
            <SettingsTab />
          )}
          {currentTab === "builder" && (
            <BuilderTab productId={productId} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Layout - Provides the unified context
 * 
 * RISE V3: Uses stable productId from ProductContext (SSOT)
 * Never derive productId from the async-loaded product object
 */
export function MembersAreaLayout() {
  const { productId } = useProductContext();
  
  return (
    <MembersAreaProvider productId={productId}>
      <MembersAreaLayoutInner />
    </MembersAreaProvider>
  );
}
