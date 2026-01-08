/**
 * Edit Member Module Dialog
 * Dialog para editar módulo (título, ativo, capa)
 * 
 * @see RISE ARCHITECT PROTOCOL
 * - Usa estado local completo até "Salvar"
 * - Upload/remoção de imagem só ocorre no "Salvar"
 * - Integra ImageCropDialog para recorte 2:3
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ImageIcon, X, Upload, Crop, Trash2 } from 'lucide-react';
import { ImageCropDialog } from '@/modules/members-area/components/dialogs/ImageCropDialog';
import type { MemberModule } from '@/modules/members-area/types/module.types';

interface EditMemberModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: MemberModule | null;
  onUpdate: (id: string, data: Partial<MemberModule>) => Promise<void>;
}

export function EditMemberModuleDialog({
  open,
  onOpenChange,
  module,
  onUpdate,
}: EditMemberModuleDialogProps) {
  // Form state (local até salvar)
  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Image state (local até salvar)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [markedForRemoval, setMarkedForRemoval] = useState(false);
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when module changes or dialog opens
  useEffect(() => {
    if (module && open) {
      setTitle(module.title || '');
      setIsActive(module.is_active ?? true);
      setLocalPreviewUrl(module.cover_image_url || null);
      setPendingFile(null);
      setMarkedForRemoval(false);
      setFileToCrop(null);
    }
  }, [module, open]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pendingFile && localPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [pendingFile, localPreviewUrl]);

  // Handle file input click
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current && !isSaving) {
      fileInputRef.current.click();
    }
  }, [isSaving]);

  // Handle image selection -> open crop dialog
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    // Open crop dialog
    setFileToCrop(file);
    setCropDialogOpen(true);
  }, []);

  // Handle crop complete
  const handleCropComplete = useCallback((croppedFile: File) => {
    // Revoke previous blob URL if exists
    if (pendingFile && localPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    // Create local preview with cropped file
    const objectUrl = URL.createObjectURL(croppedFile);
    setLocalPreviewUrl(objectUrl);
    setPendingFile(croppedFile);
    setMarkedForRemoval(false);
    setFileToCrop(null);
  }, [pendingFile, localPreviewUrl]);

  // Handle re-crop existing pending file
  const handleReCrop = useCallback(() => {
    if (pendingFile) {
      setFileToCrop(pendingFile);
      setCropDialogOpen(true);
    }
  }, [pendingFile]);

  // Handle remove cover (local only, no database update yet)
  const handleRemoveCover = useCallback(() => {
    // Revoke blob URL if exists
    if (pendingFile && localPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    
    setLocalPreviewUrl(null);
    setPendingFile(null);
    setMarkedForRemoval(true);
  }, [pendingFile, localPreviewUrl]);

  // Handle cancel (discard all local changes)
  const handleCancel = useCallback(() => {
    // Revoke blob URL if exists
    if (pendingFile && localPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    onOpenChange(false);
  }, [pendingFile, localPreviewUrl, onOpenChange]);

  // Handle save (upload image if pending, then save all)
  const handleSave = useCallback(async () => {
    if (!module) return;
    
    // Validate title
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      let finalCoverUrl = module.cover_image_url;

      // If there's a pending file, upload now
      if (pendingFile) {
        const fileExt = pendingFile.name.split('.').pop();
        const fileName = `module-cover-${module.id}-${Date.now()}.${fileExt}`;
        const filePath = `modules/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, pendingFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalCoverUrl = urlData.publicUrl;

        // Revoke blob URL
        if (localPreviewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(localPreviewUrl);
        }
      } else if (markedForRemoval) {
        // User wants to remove the image
        finalCoverUrl = null;
      }

      // Save all changes at once
      await onUpdate(module.id, {
        title: title.trim(),
        is_active: isActive,
        cover_image_url: finalCoverUrl,
      });
      
      toast.success('Módulo atualizado');
      onOpenChange(false);
    } catch (error) {
      console.error('[EditMemberModuleDialog] Save error:', error);
      toast.error('Erro ao salvar módulo');
    } finally {
      setIsSaving(false);
    }
  }, [module, title, isActive, pendingFile, markedForRemoval, localPreviewUrl, onUpdate, onOpenChange]);

  if (!module) return null;

  return (
    <>
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

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              
              {localPreviewUrl ? (
                <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                  <img
                    src={localPreviewUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-dashed bg-muted/50 flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Sem capa
                  </span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isSaving}
              />

              {/* Action Buttons */}
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isSaving}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {localPreviewUrl ? 'Trocar' : 'Adicionar'}
                </Button>

                {/* Crop button - only show if there's a pending file */}
                {pendingFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReCrop}
                    disabled={isSaving}
                  >
                    <Crop className="mr-2 h-4 w-4" />
                    Recortar
                  </Button>
                )}

                {/* Remove button - only show if there's an image */}
                {localPreviewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCover}
                    disabled={isSaving}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Formato 2:3. Máximo 5MB.
              </p>
            </div>
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
            <Button 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Crop Dialog */}
      {fileToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageFile={fileToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}