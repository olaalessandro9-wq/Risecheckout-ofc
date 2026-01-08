/**
 * Edit Member Module Dialog
 * Dialog completo para editar módulo (título, descrição, ativo, capa)
 * 
 * @see RISE ARCHITECT PROTOCOL
 * - Usa ref para file input (evita bloqueios de label/asChild)
 * - Campos editáveis: título, descrição, is_active, cover_image_url
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, ImageIcon, X, Upload } from 'lucide-react';
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
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // File input ref (evita bloqueios de label/asChild)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when module changes
  useEffect(() => {
    if (module) {
      setTitle(module.title || '');
      setDescription(module.description || '');
      setIsActive(module.is_active ?? true);
      setPreviewUrl(module.cover_image_url || null);
    }
  }, [module]);

  // Handle file input click via ref
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  // Handle image upload
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !module) return;

    // Reset input para permitir selecionar o mesmo arquivo novamente
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
      console.error('[EditMemberModuleDialog] Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  }, [module, onUpdate]);

  // Handle remove cover
  const handleRemoveCover = useCallback(async () => {
    if (!module) return;
    
    setPreviewUrl(null);
    await onUpdate(module.id, { cover_image_url: null });
  }, [module, onUpdate]);

  // Handle save all changes
  const handleSave = useCallback(async () => {
    if (!module) return;
    
    // Validate title
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      await onUpdate(module.id, {
        title: title.trim(),
        description: description.trim() || null,
        is_active: isActive,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('[EditMemberModuleDialog] Save error:', error);
      toast.error('Erro ao salvar módulo');
    } finally {
      setIsSaving(false);
    }
  }, [module, title, description, isActive, onUpdate, onOpenChange]);

  if (!module) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="module-description">Descrição</Label>
            <Textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do módulo (opcional)"
              rows={3}
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
            
            {previewUrl ? (
              <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                <img
                  src={previewUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={isSaving}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors disabled:opacity-50"
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading || isSaving}
            />

            {/* Upload Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading || isSaving}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {previewUrl ? 'Trocar Imagem' : 'Adicionar Imagem'}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Formato 2:3 recomendado. Máximo 5MB.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving || isUploading}
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
  );
}
