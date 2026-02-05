/**
 * Edit Member Module Dialog
 * 
 * Dialog para editar módulo (título, ativo, capa).
 * Usa estado local completo até "Salvar".
 * Upload/remoção de imagem só ocorre no "Salvar".
 * Delega lógica de crop/preview ao ModuleImageUploadSection.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { uploadViaEdge } from "@/lib/storage/storageProxy";

const log = createLogger("EditMemberModuleDialog");

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ModuleImageUploadSection } from "./ModuleImageUploadSection";
import type { MemberModule } from "@/modules/members-area/types/module.types";

interface EditMemberModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: MemberModule | null;
  productId?: string;
  onUpdate: (id: string, data: Partial<MemberModule>) => Promise<void>;
}

export function EditMemberModuleDialog({
  open,
  onOpenChange,
  module,
  productId,
  onUpdate,
}: EditMemberModuleDialogProps) {
  // Form state (local até salvar)
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Image state (local até salvar)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [markedForRemoval, setMarkedForRemoval] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when module changes or dialog opens
  useEffect(() => {
    if (module && open) {
      setTitle(module.title || "");
      setIsActive(module.is_active ?? true);
      setLocalPreviewUrl(module.cover_image_url || null);
      setPendingFile(null);
      setMarkedForRemoval(false);
    }
  }, [module, open]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pendingFile && localPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [pendingFile, localPreviewUrl]);

  // Handle crop complete from ModuleImageUploadSection
  const handleCropComplete = useCallback(
    (croppedFile: File) => {
      if (pendingFile && localPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      const objectUrl = URL.createObjectURL(croppedFile);
      setLocalPreviewUrl(objectUrl);
      setPendingFile(croppedFile);
      setMarkedForRemoval(false);
    },
    [pendingFile, localPreviewUrl]
  );

  // Handle remove cover (local only, no database update yet)
  const handleRemoveCover = useCallback(() => {
    if (pendingFile && localPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    setPendingFile(null);
    setMarkedForRemoval(true);
  }, [pendingFile, localPreviewUrl]);

  // Handle cancel (discard all local changes)
  const handleCancel = useCallback(() => {
    if (pendingFile && localPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    onOpenChange(false);
  }, [pendingFile, localPreviewUrl, onOpenChange]);

  // Handle save (upload image if pending, then save all)
  const handleSave = useCallback(async () => {
    if (!module) return;

    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsSaving(true);

    try {
      let finalCoverUrl = module.cover_image_url;

      if (pendingFile) {
        const fileExt = pendingFile.name.split(".").pop();
        const fileName = `module-cover-${module.id}-${Date.now()}.${fileExt}`;
        const filePath = `products/${productId}/modules/${fileName}`;

        const { publicUrl, error: uploadError } = await uploadViaEdge(
          "product-images",
          filePath,
          pendingFile,
          { upsert: true, contentType: pendingFile.type }
        );

        if (uploadError) throw uploadError;
        finalCoverUrl = publicUrl;

        if (localPreviewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(localPreviewUrl);
        }
      } else if (markedForRemoval) {
        finalCoverUrl = null;
      }

      await onUpdate(module.id, {
        title: title.trim(),
        is_active: isActive,
        cover_image_url: finalCoverUrl,
      });

      toast.success("Módulo atualizado");
      onOpenChange(false);
    } catch (error: unknown) {
      log.error("Save error:", error);
      toast.error("Erro ao salvar módulo");
    } finally {
      setIsSaving(false);
    }
  }, [
    module,
    title,
    isActive,
    pendingFile,
    markedForRemoval,
    localPreviewUrl,
    onUpdate,
    onOpenChange,
    productId,
  ]);

  if (!module) return null;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Módulo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="module-title">Título *</Label>
            <Input
              id="module-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do módulo"
              disabled={isSaving}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="module-active">Ativo</Label>
            <Switch
              id="module-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSaving}
            />
          </div>

          {/* Cover Image Section (delegated) */}
          <ModuleImageUploadSection
            previewUrl={localPreviewUrl}
            pendingFile={pendingFile}
            title={title}
            disabled={isSaving}
            onCropComplete={handleCropComplete}
            onRemove={handleRemoveCover}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
