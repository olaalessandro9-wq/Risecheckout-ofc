/**
 * AddModuleDialogNetflix - Dialog estilo Cakto (sem tabs)
 * Layout com formulário à esquerda e preview GIGANTE à direita
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadZoneCompact } from "../ImageUploadZoneCompact";
import { ModuleCardPreview } from "../ModuleCardPreview";
import { ImageCropDialog } from "./ImageCropDialog";

interface AddModuleDialogNetflixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, imageFile: File | null) => Promise<void>;
  isSaving: boolean;
}

export function AddModuleDialogNetflix({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
}: AddModuleDialogNetflixProps) {
  const [title, setTitle] = useState("");
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setOriginalImageFile(null);
      setCroppedImageFile(null);
      setImagePreview(null);
      setIsCropOpen(false);
    }
  }, [open]);

  // Generate preview URL from cropped or original file
  useEffect(() => {
    const fileToPreview = croppedImageFile || originalImageFile;
    if (fileToPreview) {
      const url = URL.createObjectURL(fileToPreview);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [croppedImageFile, originalImageFile]);

  // When user selects a new image, open crop dialog automatically
  const handleImageSelect = (file: File | null) => {
    if (file) {
      setOriginalImageFile(file);
      setCroppedImageFile(null);
      setIsCropOpen(true); // Auto-open crop dialog
    } else {
      setOriginalImageFile(null);
      setCroppedImageFile(null);
    }
  };

  // When crop is completed
  const handleCropComplete = (croppedFile: File) => {
    setCroppedImageFile(croppedFile);
  };

  // Re-crop uses the ORIGINAL image
  const handleReCrop = () => {
    if (originalImageFile) {
      setIsCropOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const finalImage = croppedImageFile || originalImageFile;
    await onSubmit(title.trim(), finalImage);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[820px] max-h-[90vh] p-0 gap-0">
          <div className="flex flex-col">
            {/* Header */}
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle className="text-xl font-semibold">Módulos</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Preencha os campos abaixo
              </DialogDescription>
            </DialogHeader>

            {/* Content Grid - Responsive: stacked on mobile, side-by-side on lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),320px] flex-1 min-h-0 overflow-hidden">
              {/* Left Side - Form fields */}
              <div className="px-6 pb-6">
                <div className="max-w-[520px] space-y-6">
                  {/* Module Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="module-title" className="text-sm font-medium">
                      Nome do Módulo
                    </Label>
                    <Input
                      id="module-title"
                      placeholder="Ex: Módulo 1"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Image Upload Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Imagem do Módulo
                    </Label>
                    <ImageUploadZoneCompact
                      imagePreview={imagePreview}
                      onImageSelect={handleImageSelect}
                      onCropClick={originalImageFile ? handleReCrop : undefined}
                      maxSizeMB={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tamanho recomendado: 400 x 600 pixels (proporção 2:3)
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side - Preview Area */}
              <div className="flex flex-col bg-muted/30 lg:border-l border-t lg:border-t-0 border-border">
                <Label className="px-6 pt-2 pb-1 text-sm text-muted-foreground shrink-0">
                  Pré-visualização
                </Label>
                <div className="flex-1 flex items-center justify-center px-4 py-2">
                  <ModuleCardPreview
                    imageUrl={imagePreview}
                    lessonsCount={0}
                    size="xl"
                  />
                </div>
              </div>
            </div>

            {/* Footer with Buttons */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6 text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || isSaving}
                className="h-10 px-6 text-sm"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog - Always receives ORIGINAL image for re-cropping */}
      {originalImageFile && (
        <ImageCropDialog
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          imageFile={originalImageFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
