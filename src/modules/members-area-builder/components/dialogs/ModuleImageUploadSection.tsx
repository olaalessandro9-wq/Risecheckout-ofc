/**
 * ModuleImageUploadSection
 * 
 * Seção de upload/preview de imagem de capa do módulo.
 * Encapsula file input, validação, crop dialog e preview.
 * Extraído de EditMemberModuleDialog para SRP.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React, { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, Crop, Trash2 } from "lucide-react";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";

const log = createLogger("ModuleImageUploadSection");

/** Tipos MIME aceitos para upload */
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Tamanho máximo em MB */
const MAX_FILE_SIZE_MB = 5;

interface ModuleImageUploadSectionProps {
  /** URL da imagem de preview (blob: local ou URL do servidor) */
  previewUrl: string | null;
  /** Arquivo pendente local (para re-crop sem fetch do servidor) */
  pendingFile: File | null;
  /** Título do módulo (usado no alt da imagem) */
  title: string;
  /** Desabilita todas as interações (ex: durante save) */
  disabled: boolean;
  /** Callback quando o crop é concluído com sucesso */
  onCropComplete: (croppedFile: File) => void;
  /** Callback para remover a imagem */
  onRemove: () => void;
}

export function ModuleImageUploadSection({
  previewUrl,
  pendingFile,
  title,
  disabled,
  onCropComplete,
  onRemove,
}: ModuleImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);

  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleImageSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input para permitir re-seleção do mesmo arquivo
      event.target.value = "";

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Imagem muito grande. Máximo ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      setFileToCrop(file);
      setCropDialogOpen(true);
    },
    []
  );

  const handleReCrop = useCallback(async () => {
    if (pendingFile) {
      // Arquivo local disponível - usar diretamente (sem fetch)
      setFileToCrop(pendingFile);
      setCropDialogOpen(true);
    } else if (previewUrl) {
      // Imagem do servidor - fetch e converter para File
      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const file = new File([blob], "cover-image.jpg", {
          type: blob.type || "image/jpeg",
        });
        setFileToCrop(file);
        setCropDialogOpen(true);
      } catch (error: unknown) {
        log.error("Error fetching image for crop:", error);
        toast.error("Não foi possível carregar a imagem para recorte");
      }
    }
  }, [pendingFile, previewUrl]);

  const handleCropDone = useCallback(
    (croppedFile: File) => {
      onCropComplete(croppedFile);
      setFileToCrop(null);
    },
    [onCropComplete]
  );

  return (
    <div className="space-y-2">
      <Label>Imagem de Capa</Label>

      {previewUrl ? (
        <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border bg-neutral-800">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt={title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="relative aspect-[2/3] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-dashed bg-muted/50 flex flex-col items-center justify-center gap-2">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sem capa</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={handleImageSelect}
        disabled={disabled}
      />

      {/* Action Buttons */}
      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          {previewUrl ? "Trocar" : "Adicionar"}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReCrop}
            disabled={disabled}
          >
            <Crop className="mr-2 h-4 w-4" />
            Recortar
          </Button>
        )}

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Formato 2:3. Máximo {MAX_FILE_SIZE_MB}MB.
      </p>

      {/* Crop Dialog */}
      {fileToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageFile={fileToCrop}
          onCropComplete={handleCropDone}
          preset="module"
        />
      )}
    </div>
  );
}
