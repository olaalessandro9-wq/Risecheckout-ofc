import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ComponentData } from "../../types";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import type { ImageContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";
import { createLogger } from "@/lib/logger";

const log = createLogger("ImageEditor");

interface ImageEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<ImageContent>) => void;
  design?: CheckoutDesign;
}

export const ImageEditor = ({ component, onChange }: ImageEditorProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = (component.content || {}) as ImageContent;
  const imageInputId = `image-upload-${component.id}`;
  const isUploading = content._uploading === true;

  const handleChange = <K extends keyof ImageContent>(field: K, value: ImageContent[K]) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. Validações
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (JPG/PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Imagem muito grande (máx. 10MB).');
      return;
    }

    // 2. Preview imediato e marca uploading
    const previewUrl = URL.createObjectURL(file);
    onChange({
      ...content,
      imageUrl: previewUrl,   // preview local
      _preview: true,
      _uploading: true,
      _uploadError: false,
      _fileName: file.name,
      _old_storage_path: content._storage_path, // Guarda o path antigo para deletar depois do save
    });

    // 3. Upload via Edge Function em background
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `checkout-components/${component.id}-${Date.now()}.${fileExt}`;

      // Fazer upload via storageProxy
      const { publicUrl, error: uploadError } = await uploadViaEdge(
        'product-images',
        fileName,
        file,
        { upsert: true }
      );

      if (uploadError) throw uploadError;
      if (!publicUrl) throw new Error('Public URL não retornada');

      // 4. Atualizar componente com a URL pública e storage_path
      onChange({
        ...content,
        imageUrl: publicUrl,
        url: publicUrl,
        _storage_path: fileName, // Novo storage path
        _uploading: false,
        _preview: false,
      });

      // 5. Revogar preview blob
      setTimeout(() => {
        try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
      }, 2000);

    } catch (err: unknown) {
      log.error("Upload da imagem falhou:", err);
      onChange({
        ...content,
        _uploading: false,
        _uploadError: true,
        _old_storage_path: undefined, // Não deletar o antigo
      });
      alert("Falha ao enviar imagem. Tente novamente.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload de Imagem */}
      <div>
        <Label>Arraste ou selecione o arquivo</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
            id={imageInputId}
            disabled={isUploading}
          />
          <label htmlFor={imageInputId} className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="text-gray-500">
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm">Enviando imagem...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm">Solte os arquivos aqui ou clique para fazer upload</p>
                  <p className="text-xs mt-1">Formatos aceitos: JPG ou PNG. Tamanho máximo: 10MB</p>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Alinhamento */}
      <div>
        <Label>Alinhamento</Label>
        <div className="flex gap-2 mt-1">
          <Button
            variant={content.alignment === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "left")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="15" y2="12"/>
              <line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
          </Button>
          <Button
            variant={content.alignment === "center" || !content.alignment ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "center")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="6" y1="12" x2="18" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </Button>
          <Button
            variant={content.alignment === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => handleChange("alignment", "right")}
            className="flex-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="9" y1="12" x2="21" y2="12"/>
              <line x1="6" y1="18" x2="21" y2="18"/>
            </svg>
          </Button>
        </div>
      </div>

      {/* Texto Alternativo */}
      <div>
        <Label>Texto Alternativo (Alt)</Label>
        <Input
          value={content.alt || ""}
          onChange={(e) => handleChange("alt", e.target.value)}
          placeholder="Descrição da imagem"
        />
      </div>

      {/* Largura Máxima */}
      <div>
        <Label>Largura Máxima (px)</Label>
        <Input
          type="number"
          value={content.maxWidth || 720}
          onChange={(e) => handleChange("maxWidth", parseInt(e.target.value) || 720)}
          min={100}
          max={1200}
          placeholder="720"
        />
      </div>

      {/* Bordas Arredondadas */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`rounded-${component.id}`}
          checked={content.roundedImage !== false}
          onChange={(e) => handleChange("roundedImage", e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor={`rounded-${component.id}`} className="cursor-pointer">
          Bordas Arredondadas
        </Label>
      </div>
    </div>
  );
};
