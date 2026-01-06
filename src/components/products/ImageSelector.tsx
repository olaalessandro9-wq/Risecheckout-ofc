import { useState, useRef } from "react";
import { Upload, Link2, X, Crop, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageCropDialogProduct } from "./ImageCropDialogProduct";

interface ImageSelectorProps {
  imageUrl?: string | null;
  imageFile?: File | null;
  onImageFileChange: (file: File | null) => void;
  onImageUrlChange: (url: string) => void;
  onRemoveImage: () => void;
  pendingRemoval?: boolean;
}

export function ImageSelector({
  imageUrl,
  imageFile,
  onImageFileChange,
  onImageUrlChange,
  onRemoveImage,
  pendingRemoval = false,
}: ImageSelectorProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Salvar arquivo original e abrir crop dialog
      setOriginalFile(file);
      setIsCropOpen(true);
    }
    // Limpar input para permitir selecionar mesmo arquivo
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    onImageFileChange(croppedFile);
    setIsCropOpen(false);
  };

  const handleReCrop = () => {
    if (originalFile) {
      setIsCropOpen(true);
    } else if (imageFile) {
      // Se não tem original, usar o arquivo atual
      setOriginalFile(imageFile);
      setIsCropOpen(true);
    }
  };

  const handleEditImage = () => {
    // Abre seletor de arquivo para trocar a imagem
    fileInputRef.current?.click();
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onImageUrlChange(urlInput.trim());
      setUrlInput("");
    }
  };

  // Se já tem imagem (URL ou arquivo) e não está marcada para remoção
  if (!pendingRemoval && (imageUrl || imageFile)) {
    const displayUrl = imageFile ? URL.createObjectURL(imageFile) : imageUrl;
    const canCrop = !!imageFile || !!originalFile;
    
    return (
      <div className="space-y-3">
        <img 
          src={displayUrl || ""} 
          alt="Imagem do produto" 
          className="max-w-xs rounded-lg border border-border"
        />
        
        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2">
          {canCrop && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReCrop}
              className="gap-2"
            >
              <Crop className="w-4 h-4" />
              Recortar
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditImage}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Trocar imagem
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemoveImage}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Remover
          </Button>
        </div>

        {/* Input oculto para trocar imagem */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Dialog de crop */}
        {originalFile && (
          <ImageCropDialogProduct
            open={isCropOpen}
            onOpenChange={setIsCropOpen}
            imageFile={originalFile}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    );
  }

  // Se marcado para remoção ou sem imagem - mostrar opções de adicionar
  return (
    <div className="space-y-4">
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as "upload" | "url")}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="upload" id="upload-mode" />
          <Label htmlFor="upload-mode" className="cursor-pointer">Upload de arquivo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="url" id="url-mode" />
          <Label htmlFor="url-mode" className="cursor-pointer">URL da imagem</Label>
        </div>
      </RadioGroup>

      {mode === "upload" ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            id="product-image"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="product-image" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Formatos aceitos: JPG ou PNG. Tamanho máximo: 10MB
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              Tamanho recomendado: 800 x 600 pixels (proporção 4:3)
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="image-url" className="text-foreground">URL da Imagem</Label>
          <div className="flex gap-2">
            <Input
              id="image-url"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="bg-background border-border text-foreground"
            />
            <Button 
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="gap-2"
            >
              <Link2 className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole a URL completa da imagem. Tamanho recomendado: 800 x 600 pixels (proporção 4:3)
          </p>
        </div>
      )}

      {/* Dialog de crop (para quando selecionar arquivo) */}
      {originalFile && (
        <ImageCropDialogProduct
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          imageFile={originalFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

