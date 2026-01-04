/**
 * AddModuleDialogNetflix - Dialog estilo Cakto com tabs (Geral/Cover)
 * Layout com formulário à esquerda e preview GRANDE à direita
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadZoneVertical } from "../ImageUploadZoneVertical";
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
  const [activeTab, setActiveTab] = useState("geral");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setOriginalImageFile(null);
      setCroppedImageFile(null);
      setImagePreview(null);
      setIsCropOpen(false);
      setActiveTab("geral");
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
        <DialogContent className="sm:max-w-[1000px] p-0 gap-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="px-8 pt-8 pb-6">
              <DialogTitle className="text-2xl font-semibold">Módulos</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Preencha os campos abaixo
              </DialogDescription>
            </DialogHeader>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-0 flex-1">
              {/* Left Side - Tabs */}
              <div className="px-8 pb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-14 mb-8 bg-muted/50">
                    <TabsTrigger 
                      value="geral" 
                      className="text-base font-medium h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Geral
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cover" 
                      className="text-base font-medium h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Cover
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Geral - Module Name */}
                  <TabsContent value="geral" className="mt-0">
                    <div className="space-y-3">
                      <Label htmlFor="module-title" className="text-base font-medium">
                        Nome do Módulo
                      </Label>
                      <Input
                        id="module-title"
                        placeholder="Ex: Módulo 1"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-14 text-base px-4"
                        autoFocus
                      />
                    </div>
                  </TabsContent>

                  {/* Tab Cover - Image Upload (Vertical) */}
                  <TabsContent value="cover" className="mt-0">
                    <div className="flex justify-center py-6">
                      <ImageUploadZoneVertical
                        imagePreview={imagePreview}
                        onImageSelect={handleImageSelect}
                        onCropClick={originalImageFile ? handleReCrop : undefined}
                        maxSizeMB={10}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Side - Large Preview */}
              <div className="hidden lg:flex flex-col bg-muted/30 p-8 border-l border-border">
                <Label className="mb-4 text-base text-muted-foreground">Pré-visualização</Label>
                <div className="flex-1 flex items-start justify-center pt-4">
                  <ModuleCardPreview
                    imageUrl={imagePreview}
                    lessonsCount={0}
                  />
                </div>
              </div>
            </div>

            {/* Footer with Buttons */}
            <div className="flex justify-end gap-4 px-8 py-6 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 px-8 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || isSaving}
                className="h-12 px-8 text-base"
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
