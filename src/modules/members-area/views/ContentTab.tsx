/**
 * ContentTab - Aba de gestão de conteúdo (módulos e aulas)
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { ModulesList } from "@/modules/products/tabs/members-area/components";
import { AddModuleDialogNetflix, EditModuleDialogNetflix } from "@/modules/members-area/components/dialogs";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import type { UseMembersAreaReturn } from "../hooks";
import type { EditingModuleData, ContentType } from "@/modules/members-area/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("ContentTab");

interface ContentTabProps {
  membersAreaData: UseMembersAreaReturn;
  productId?: string;
}

export function ContentTab({ membersAreaData, productId }: ContentTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    isSaving,
    modules,
    addModule,
    updateModule,
    deleteModule,
    deleteContent,
    reorderModules,
    reorderContents,
  } = membersAreaData;

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<EditingModuleData | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom confirmation dialog
  const { confirm, Bridge } = useConfirmDelete();

  // Navigate to content editor
  const handleOpenAddContent = (moduleId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("mode", "new");
    newParams.set("moduleId", moduleId);
    setSearchParams(newParams);
  };

  const handleEditContent = (content: { id: string }) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("mode", "edit");
    newParams.set("contentId", content.id);
    newParams.set("moduleId", modules.find(m => m.contents?.some(c => c.id === content.id))?.id || "");
    setSearchParams(newParams);
  };

  const handleAddModule = async (title: string, imageFile: File | null) => {
    setIsSubmitting(true);
    
    try {
      let coverImageUrl: string | undefined;

      if (imageFile && productId) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `products/${productId}/modules/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadViaEdge(
          'product-images',
          filePath,
          imageFile,
          { upsert: true }
        );

        if (uploadError) {
          log.error("Upload error:", uploadError);
        } else if (publicUrl) {
          coverImageUrl = publicUrl;
        }
      }

      await addModule(title, undefined, coverImageUrl);
      setIsAddModuleOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateModule = async (id: string, title: string, imageFile: File | null, keepExistingImage: boolean) => {
    setIsSubmitting(true);
    
    try {
      let coverImageUrl: string | undefined;

      if (imageFile && productId) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `products/${productId}/modules/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadViaEdge(
          'product-images',
          filePath,
          imageFile,
          { upsert: true }
        );

        if (uploadError) {
          log.error("Upload error:", uploadError);
        } else if (publicUrl) {
          coverImageUrl = publicUrl;
        }
      }

      const updateData: { title: string; cover_image_url?: string | null } = { title };
      if (!keepExistingImage) {
        updateData.cover_image_url = coverImageUrl || null;
      }

      await updateModule(id, updateData);
      setEditingModule(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    const module = modules.find(m => m.id === id);
    await confirm({
      resourceType: "Módulo",
      resourceName: module?.title || "Módulo",
      description: "Tem certeza que deseja excluir este módulo e todo seu conteúdo?",
      onConfirm: async () => {
        await deleteModule(id);
      },
    });
  };

  const handleDeleteContent = async (id: string) => {
    const content = modules.flatMap(m => m.contents || []).find(c => c.id === id);
    await confirm({
      resourceType: "Conteúdo",
      resourceName: content?.title || "Conteúdo",
      description: "Tem certeza que deseja excluir este conteúdo?",
      onConfirm: async () => {
        await deleteContent(id);
      },
    });
  };

  const totalContents = modules.reduce((acc, mod) => acc + (mod.contents?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
        onEditModule={(module) => setEditingModule({
          id: module.id,
          title: module.title,
          cover_image_url: module.cover_image_url,
        })}
        onDeleteModule={handleDeleteModule}
        onAddContent={handleOpenAddContent}
        onEditContent={handleEditContent}
        onDeleteContent={handleDeleteContent}
        onReorderModules={reorderModules}
        onReorderContents={reorderContents}
      />

      {/* Dialogs */}
      <AddModuleDialogNetflix
        open={isAddModuleOpen}
        onOpenChange={setIsAddModuleOpen}
        onSubmit={handleAddModule}
        isSaving={isSubmitting}
      />

      <EditModuleDialogNetflix
        module={editingModule}
        onOpenChange={(open) => !open && setEditingModule(null)}
        onSubmit={handleUpdateModule}
        isSaving={isSubmitting}
      />

      {Bridge()}
    </div>
  );
}
