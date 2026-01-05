/**
 * ContentTab - Aba de gestão de conteúdo (módulos e aulas)
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  ModulesList,
  AddContentDialog,
  EditContentDialog,
} from "@/modules/products/tabs/members-area/components";
import { AddModuleDialogNetflix, EditModuleDialogNetflix } from "@/modules/members-area/components/dialogs";
import type { EditingContent } from "@/modules/products/tabs/members-area/types";
import type { UseMembersAreaReturn } from "@/hooks/useMembersArea";

interface EditingModuleData {
  id: string;
  title: string;
  cover_image_url: string | null;
}

interface ContentTabProps {
  membersAreaData: UseMembersAreaReturn;
  productId?: string;
}

export function ContentTab({ membersAreaData, productId }: ContentTabProps) {
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
  const [editingModule, setEditingModule] = useState<EditingModuleData | null>(null);
  const [editingContent, setEditingContent] = useState<EditingContent | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Form states for content
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentType, setContentType] = useState<string>("video");
  const [contentUrl, setContentUrl] = useState("");

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
          cover_image_url: (module as any).cover_image_url || null,
        })}
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
