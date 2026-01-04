/**
 * AddModuleDialogNetflix - Dialog estilo Netflix/Kiwify para adicionar módulo
 * Layout com formulário à esquerda e preview GRANDE à direita
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadZone } from "../ImageUploadZone";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setImageFile(null);
      setImagePreview(null);
      setIsCropOpen(false);
    }
  }, [open]);

  // Generate preview URL when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
  };

  const handleCropComplete = (croppedFile: File) => {
    setImageFile(croppedFile);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit(title.trim(), imageFile);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>Adicionar módulo</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr,280px] gap-8 py-4">
            {/* Left Side - Form */}
            <div className="space-y-5">
              {/* Module Name */}
              <div className="space-y-2">
                <Label htmlFor="module-title">Nome do módulo</Label>
                <Input
                  id="module-title"
                  placeholder="Ex: Introdução ao Curso"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagem</Label>
                <ImageUploadZone
                  imagePreview={imagePreview}
                  onImageSelect={handleImageSelect}
                  onCropClick={imageFile ? () => setIsCropOpen(true) : undefined}
                  maxSizeMB={10}
                  recommendedSize="320x480 px"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || isSaving}
                className="w-full"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Adicionar módulo
              </Button>
            </div>

            {/* Right Side - Large Preview */}
            <div className="hidden sm:block">
              <ModuleCardPreview
                imageUrl={imagePreview}
                lessonsCount={0}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      {imageFile && (
        <ImageCropDialog
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          imageFile={imageFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
