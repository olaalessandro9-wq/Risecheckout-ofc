/**
 * ContentTab - Aba de gestão de conteúdo (módulos e aulas)
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ModulesList } from "@/modules/products/tabs/members-area/components";
import { AddModuleDialogNetflix, EditModuleDialogNetflix } from "@/modules/members-area/components/dialogs";
import type { UseMembersAreaReturn } from "@/hooks/members-area";
import type { EditingModuleData, ContentType } from "@/modules/members-area/types";

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
  } = membersAreaData;

  // Dialog states
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<EditingModuleData | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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
    let coverImageUrl: string | undefined;

    // Upload image if provided
    if (imageFile && productId) {
      setIsUploading(true);
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${productId}/modules/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("[ContentTab] Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
          coverImageUrl = publicUrl;
        }
      } catch (error) {
        console.error("[ContentTab] Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }

    await addModule(title, undefined, coverImageUrl);
    setIsAddModuleOpen(false);
  };

  const handleUpdateModule = async (id: string, title: string, imageFile: File | null, keepExistingImage: boolean) => {
    let coverImageUrl: string | undefined;

    // Upload new image if provided
    if (imageFile && productId) {
      setIsUploading(true);
      try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${productId}/modules/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("[ContentTab] Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);
          coverImageUrl = publicUrl;
        }
      } catch (error) {
        console.error("[ContentTab] Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }

    // Build update object
    const updateData: { title: string; cover_image_url?: string | null } = { title };
    if (!keepExistingImage) {
      // User selected a new image (or removed the image)
      updateData.cover_image_url = coverImageUrl || null;
    }

    await updateModule(id, updateData);
    setEditingModule(null);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este módulo e todo seu conteúdo?")) {
      await deleteModule(id);
    }
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
      />

      {/* Dialogs */}
      <AddModuleDialogNetflix
        open={isAddModuleOpen}
        onOpenChange={setIsAddModuleOpen}
        onSubmit={handleAddModule}
        isSaving={isSaving || isUploading}
      />

      <EditModuleDialogNetflix
        module={editingModule}
        onOpenChange={(open) => !open && setEditingModule(null)}
        onSubmit={handleUpdateModule}
        isSaving={isSaving || isUploading}
      />
    </div>
  );
}
