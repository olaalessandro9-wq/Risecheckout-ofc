import { useState } from "react";
import { Upload, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageFileChange(file);
    }
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
    
    return (
      <div className="mb-4">
        <img 
          src={displayUrl || ""} 
          alt="Imagem do produto" 
          className="max-w-xs rounded-lg border border-border"
        />
        <Button
          variant="destructive"
          size="sm"
          onClick={onRemoveImage}
          className="mt-2 gap-2"
        >
          <X className="w-4 h-4" />
          Remover Imagem
        </Button>
      </div>
    );
  }

  // Se marcado para remoção, mostrar opções de adicionar nova
  // (mas não mostrar a mensagem de remoção)

  // Seletor de modo (upload ou URL)
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
            <p className="text-xs text-muted-foreground">
              Tamanho recomendado: 300x250 pixels
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
            Cole a URL completa da imagem (ex: https://exemplo.com/imagem.jpg)
          </p>
        </div>
      )}
    </div>
  );
}

