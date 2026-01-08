/**
 * Edit Module Cover Dialog
 * Dialog para editar a capa de um módulo no builder
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useState, useCallback } from 'react';
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
import { Loader2, ImageIcon, X } from 'lucide-react';
import type { MemberModule } from '@/modules/members-area/types/module.types';

interface EditModuleCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: MemberModule | null;
  onUpdate: (id: string, data: Partial<MemberModule>) => Promise<void>;
}

export function EditModuleCoverDialog({
  open,
  onOpenChange,
  module,
  onUpdate,
}: EditModuleCoverDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset preview when module changes
  React.useEffect(() => {
    setPreviewUrl(module?.cover_image_url || null);
  }, [module]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !module) return;

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

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `module-cover-${module.id}-${Date.now()}.${fileExt}`;
      const filePath = `modules/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update preview immediately
      setPreviewUrl(publicUrl);

      // Update module in database
      await onUpdate(module.id, { cover_image_url: publicUrl });

    } catch (error) {
      console.error('[EditModuleCoverDialog] Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  }, [module, onUpdate]);

  const handleRemoveCover = useCallback(async () => {
    if (!module) return;
    
    setPreviewUrl(null);
    await onUpdate(module.id, { cover_image_url: null });
  }, [module, onUpdate]);

  if (!module) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Capa do Módulo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Module Title (read-only) */}
          <div className="space-y-2">
            <Label>Módulo</Label>
            <Input 
              value={module.title} 
              disabled 
              className="bg-muted"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            
            {previewUrl ? (
              <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt={module.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-dashed bg-muted/50 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Sem capa
                </span>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={isUploading}
                className="relative"
                asChild
              >
                <label className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {previewUrl ? 'Trocar Imagem' : 'Adicionar Imagem'}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Formato 2:3 recomendado. Máximo 5MB.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
