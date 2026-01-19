/**
 * Banner Slide Upload - Upload de imagem para slides do banner com crop
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon, Loader2, Crop } from 'lucide-react';
import { toast } from 'sonner';
import { uploadViaEdge } from '@/lib/storage/storageProxy';
import { createLogger } from '@/lib/logger';

const log = createLogger('BannerSlideUpload');
import { BannerImageCropDialog } from '../../dialogs/BannerImageCropDialog';

interface BannerSlideUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;

export function BannerSlideUpload({ imageUrl, onImageChange }: BannerSlideUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { publicUrl, error: uploadError } = await uploadViaEdge(
        'product-images',
        filePath,
        file,
        { upsert: false, contentType: file.type }
      );

      if (uploadError) {
        throw uploadError;
      }

      if (publicUrl) {
        onImageChange(publicUrl);
        toast.success('Imagem enviada com sucesso!');
      }
    } catch (error: unknown) {
      log.error('Upload error:', error);
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setFileToCrop(file);
      setCropDialogOpen(true);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setFileToCrop(file);
      setCropDialogOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onImageChange('');
  };

  const handleCropComplete = useCallback((croppedFile: File) => {
    handleUpload(croppedFile);
    setFileToCrop(null);
  }, []);

  const handleReCrop = useCallback(async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'banner-recrop.jpg', { type: blob.type || 'image/jpeg' });
      setFileToCrop(file);
      setCropDialogOpen(true);
    } catch (error: unknown) {
      log.error('Error loading image for re-crop:', error);
      toast.error('Erro ao carregar imagem para recorte.');
    }
  }, [imageUrl]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted aspect-video">
          <img
            src={imageUrl}
            alt="Preview do slide"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              Trocar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReCrop}
              disabled={isUploading}
            >
              <Crop className="h-4 w-4 mr-1" />
              Recortar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
            'flex flex-col items-center justify-center text-center',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Clique ou arraste uma imagem
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP ou GIF (máx. {MAX_SIZE_MB}MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      {fileToCrop && (
        <BannerImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            if (!open) setFileToCrop(null);
          }}
          imageFile={fileToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
