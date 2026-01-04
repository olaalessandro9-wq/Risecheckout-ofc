/**
 * ContentTab - Aba de gestão de conteúdo (módulos e aulas)
 */

import { useState } from "react";
import { Plus, Library, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ModulesList,
  AddModuleDialog,
  EditModuleDialog,
  AddContentDialog,
  EditContentDialog,
} from "@/modules/products/tabs/members-area/components";
import type { EditingModule, EditingContent } from "@/modules/products/tabs/members-area/types";
import type { UseMembersAreaReturn } from "@/hooks/useMembersArea";

interface ContentTabProps {
  membersAreaData: UseMembersAreaReturn;
}

export function ContentTab({ membersAreaData }: ContentTabProps) {
  const {
    isSaving,
    modules,
    addModule,
    updateModule,
    deleteModule,
    addContent,
    updateContent,
    deleteContent,
  } = membersAreaData;

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<EditingModule | null>(null);
  const [editingContent, setEditingContent] = useState<EditingContent | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);

  // Form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentType, setContentType] = useState<string>("video");
  const [contentUrl, setContentUrl] = useState("");

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

  const totalContents = modules.reduce((acc, mod) => acc + (mod.contents?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Library className="h-4 w-4" />
            Biblioteca de Vídeos
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setAllExpanded(!allExpanded)}
            className="gap-2"
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expandir
              </>
            )}
          </Button>
        </div>

        <Button 
          onClick={() => setIsAddModuleOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Módulo
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{modules.length} módulo{modules.length !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{totalContents} conteúdo{totalContents !== 1 ? 's' : ''}</span>
      </div>

      {/* Modules List */}
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

      {/* Dialogs */}
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
    </div>
  );
}
