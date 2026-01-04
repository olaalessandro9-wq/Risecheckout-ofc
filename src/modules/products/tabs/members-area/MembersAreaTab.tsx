/**
 * MembersAreaTab - Aba de configuração da Área de Membros
 * 
 * Refatorado para seguir Rise Protocol (< 300 linhas)
 * Orquestra componentes menores para gestão de módulos e conteúdos
 */

import { useState } from "react";
import { useProductContext } from "../../context/ProductContext";
import { useMembersArea } from "@/hooks/useMembersArea";
import { Loader2 } from "lucide-react";
import { 
  MembersAreaHeader, 
  ModulesList,
  AddModuleDialog,
  EditModuleDialog,
  AddContentDialog,
  EditContentDialog,
} from "./components";
import type { EditingModule, EditingContent } from "./types";

export function MembersAreaTab() {
  const { product: productData } = useProductContext();
  const {
    isLoading,
    isSaving,
    settings,
    modules,
    updateSettings,
    addModule,
    updateModule,
    deleteModule,
    addContent,
    updateContent,
    deleteContent,
  } = useMembersArea(productData?.id);

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<EditingModule | null>(null);
  const [editingContent, setEditingContent] = useState<EditingContent | null>(null);

  // Form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentType, setContentType] = useState<string>("video");
  const [contentUrl, setContentUrl] = useState("");

  const handleToggleEnabled = async (enabled: boolean) => {
    await updateSettings(enabled);
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return;
    await addModule(moduleTitle, moduleDescription);
    setModuleTitle("");
    setModuleDescription("");
    setIsAddModuleOpen(false);
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !editingModule.title.trim()) return;
    await updateModule(editingModule.id, { 
      title: editingModule.title, 
      description: editingModule.description || null 
    });
    setEditingModule(null);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este módulo e todo seu conteúdo?")) {
      await deleteModule(id);
    }
  };

  const handleOpenAddContent = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setContentTitle("");
    setContentDescription("");
    setContentType("video");
    setContentUrl("");
    setIsAddContentOpen(true);
  };

  const handleAddContent = async () => {
    if (!selectedModuleId || !contentTitle.trim()) return;
    await addContent(selectedModuleId, {
      title: contentTitle,
      description: contentDescription || null,
      content_type: contentType as any,
      content_url: contentUrl || null,
      content_data: {},
      is_active: true,
    });
    setIsAddContentOpen(false);
  };

  const handleUpdateContent = async () => {
    if (!editingContent || !editingContent.title.trim()) return;
    await updateContent(editingContent.id, {
      title: editingContent.title,
      description: editingContent.description || null,
      content_type: editingContent.content_type as any,
      content_url: editingContent.content_url || null,
    });
    setEditingContent(null);
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este conteúdo?")) {
      await deleteContent(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MembersAreaHeader
        enabled={settings.enabled}
        isSaving={isSaving}
        onToggle={handleToggleEnabled}
      />

      {settings.enabled && (
        <>
          <ModulesList
            modules={modules}
            onAddModule={() => setIsAddModuleOpen(true)}
            onEditModule={setEditingModule}
            onDeleteModule={handleDeleteModule}
            onAddContent={handleOpenAddContent}
            onEditContent={(content) => setEditingContent({
              id: content.id,
              title: content.title,
              description: content.description,
              content_type: content.content_type,
              content_url: content.content_url,
            })}
            onDeleteContent={handleDeleteContent}
          />

          <AddModuleDialog
            open={isAddModuleOpen}
            onOpenChange={setIsAddModuleOpen}
            title={moduleTitle}
            description={moduleDescription}
            onTitleChange={setModuleTitle}
            onDescriptionChange={setModuleDescription}
            onSubmit={handleAddModule}
            isSaving={isSaving}
          />

          <EditModuleDialog
            module={editingModule}
            onModuleChange={setEditingModule}
            onSubmit={handleUpdateModule}
            isSaving={isSaving}
          />

          <AddContentDialog
            open={isAddContentOpen}
            onOpenChange={setIsAddContentOpen}
            title={contentTitle}
            description={contentDescription}
            contentType={contentType}
            contentUrl={contentUrl}
            onTitleChange={setContentTitle}
            onDescriptionChange={setContentDescription}
            onContentTypeChange={setContentType}
            onContentUrlChange={setContentUrl}
            onSubmit={handleAddContent}
            isSaving={isSaving}
          />

          <EditContentDialog
            content={editingContent}
            onContentChange={setEditingContent}
            onSubmit={handleUpdateContent}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}
