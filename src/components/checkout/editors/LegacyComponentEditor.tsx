import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckoutComponent } from "@/hooks/useCheckoutEditor";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeText, sanitizeUrl, sanitizeColor } from "@/lib/security";

interface LegacyComponentEditorProps {
  component: CheckoutComponent;
  onUpdate: (id: string, content: any) => void;
}

// Campos que são URLs
const URL_FIELDS = ['imageUrl', 'videoUrl', 'url', 'avatar', 'src'];

// Campos que são cores
const COLOR_FIELDS = ['color', 'backgroundColor', 'textColor', 'iconColor', 'borderColor', 'timerColor'];

// Campos que são texto simples (sem HTML)
const TEXT_FIELDS = ['text', 'title', 'description', 'name', 'activeText', 'finishedText', 'topText', 'subtitle'];

export const LegacyComponentEditor: React.FC<LegacyComponentEditorProps> = ({
  component,
  onUpdate,
}) => {
  /**
   * Handler genérico com sanitização XSS
   * Aplica sanitização apropriada baseada no tipo de campo
   */
  const handleChange = (field: string, value: any) => {
    let sanitizedValue = value;
    
    // Sanitiza baseado no tipo de campo
    if (typeof value === 'string') {
      if (URL_FIELDS.includes(field)) {
        sanitizedValue = sanitizeUrl(value);
      } else if (COLOR_FIELDS.includes(field) || field.toLowerCase().includes('color')) {
        // Cores: valida formato hex, mantém o default do componente se inválido
        const defaultColor = component.content?.[field] || '#000000';
        sanitizedValue = sanitizeColor(value, defaultColor);
      } else if (TEXT_FIELDS.includes(field)) {
        sanitizedValue = sanitizeText(value);
      }
    }
    
    onUpdate(component.id, { ...component.content, [field]: sanitizedValue });
  };

  // Handler específico para upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      alert("Arquivo inválido (deve ser imagem < 10MB)");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    // 1. Preview imediato
    onUpdate(component.id, {
      ...component.content,
      imageUrl: previewUrl,
      _preview: true,
      _uploading: true,
      _fileName: file.name,
      _old_storage_path: component.content?._storage_path,
    });

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `checkout-components/${component.id}-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);

      // 2. Sucesso
      onUpdate(component.id, {
        ...component.content,
        imageUrl: data.publicUrl,
        url: data.publicUrl,
        _storage_path: fileName,
        _uploading: false,
        _preview: false,
      });
    } catch (err) {
      console.error(err);
      onUpdate(component.id, { ...component.content, _uploading: false, _uploadError: true });
      alert("Erro ao enviar imagem");
    }
  };

  // --- RENDERIZADORES POR TIPO ---

  if (component.type === "text") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Texto</Label>
          <Input 
            value={component.content?.text || ""} 
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Digite o texto"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tamanho (px)</Label>
            <Input 
              type="number" 
              value={component.content?.fontSize || 16} 
              onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
              min={12}
              max={48}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              <input 
                type="color" 
                className="w-12 h-10 rounded cursor-pointer" 
                value={component.content?.color || "#000000"} 
                onChange={(e) => handleChange("color", e.target.value)} 
              />
              <Input 
                value={component.content?.color || "#000000"} 
                onChange={(e) => handleChange("color", e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Fundo</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.backgroundColor || "#FFFFFF"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)} 
            />
            <Input 
              value={component.content?.backgroundColor || "#FFFFFF"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor da Borda</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.borderColor || "#E5E7EB"} 
              onChange={(e) => handleChange("borderColor", e.target.value)} 
            />
            <Input 
              value={component.content?.borderColor || "#E5E7EB"} 
              onChange={(e) => handleChange("borderColor", e.target.value)}
              placeholder="#E5E7EB"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <Select 
            value={component.content?.align || "left"}
            onValueChange={(value) => handleChange("align", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (component.type === "image") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Upload de Imagem</Label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            disabled={component.content?._uploading} 
          />
          {component.content?._uploading && (
            <p className="text-xs text-muted-foreground">Enviando...</p>
          )}
          {component.content?._uploadError && (
            <p className="text-xs text-destructive">Erro ao enviar imagem</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>URL (Opcional)</Label>
          <Input 
            value={component.content?.imageUrl || ""} 
            onChange={(e) => handleChange("imageUrl", e.target.value)} 
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <Select 
            value={component.content?.align || "center"}
            onValueChange={(value) => handleChange("align", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (component.type === "advantage") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input 
            value={component.content?.title || ""} 
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Título da vantagem"
          />
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input 
            value={component.content?.description || ""} 
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Descrição da vantagem"
          />
        </div>
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select 
            value={component.content?.icon || "check"}
            onValueChange={(value) => handleChange("icon", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="star">Estrela</SelectItem>
              <SelectItem value="heart">Coração</SelectItem>
              <SelectItem value="shield">Escudo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cor do Ícone</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.iconColor || "#10B981"} 
              onChange={(e) => handleChange("iconColor", e.target.value)} 
            />
            <Input 
              value={component.content?.iconColor || "#10B981"} 
              onChange={(e) => handleChange("iconColor", e.target.value)}
              placeholder="#10B981"
            />
          </div>
        </div>
      </div>
    );
  }

  if (component.type === "seal") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Texto do Selo</Label>
          <Input 
            value={component.content?.text || ""} 
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Ex: Garantia de 7 dias"
          />
        </div>
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.backgroundColor || "#EF4444"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)} 
            />
            <Input 
              value={component.content?.backgroundColor || "#EF4444"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              placeholder="#EF4444"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.textColor || "#FFFFFF"} 
              onChange={(e) => handleChange("textColor", e.target.value)} 
            />
            <Input 
              value={component.content?.textColor || "#FFFFFF"} 
              onChange={(e) => handleChange("textColor", e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>
    );
  }

  if (component.type === "timer") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Minutos</Label>
            <Input 
              type="number" 
              value={component.content?.minutes || 15} 
              onChange={(e) => handleChange("minutes", parseInt(e.target.value))}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Segundos</Label>
            <Input 
              type="number" 
              value={component.content?.seconds || 0} 
              onChange={(e) => handleChange("seconds", parseInt(e.target.value))}
              min={0}
              max={59}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Texto</Label>
          <Input 
            value={component.content?.text || "Oferta por tempo limitado"} 
            onChange={(e) => handleChange("text", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.backgroundColor || "#EF4444"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)} 
            />
            <Input 
              value={component.content?.backgroundColor || "#EF4444"} 
              onChange={(e) => handleChange("backgroundColor", e.target.value)}
              placeholder="#EF4444"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex gap-2">
            <input 
              type="color" 
              className="w-12 h-10 rounded cursor-pointer" 
              value={component.content?.textColor || "#FFFFFF"} 
              onChange={(e) => handleChange("textColor", e.target.value)} 
            />
            <Input 
              value={component.content?.textColor || "#FFFFFF"} 
              onChange={(e) => handleChange("textColor", e.target.value)}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>
    );
  }

  if (component.type === "testimonial") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input 
            value={component.content?.name || ""} 
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
        <div className="space-y-2">
          <Label>Depoimento</Label>
          <Input 
            value={component.content?.text || ""} 
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="Texto do depoimento"
          />
        </div>
        <div className="space-y-2">
          <Label>Avaliação (estrelas)</Label>
          <Input 
            type="number" 
            value={component.content?.rating || 5} 
            onChange={(e) => handleChange("rating", parseInt(e.target.value))}
            min={1}
            max={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Foto (URL)</Label>
          <Input 
            value={component.content?.imageUrl || ""} 
            onChange={(e) => handleChange("imageUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    );
  }

  if (component.type === "video") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL do Vídeo (YouTube/Vimeo)</Label>
          <Input 
            value={component.content?.videoUrl || ""} 
            onChange={(e) => handleChange("videoUrl", e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label>Proporção</Label>
          <Select 
            value={component.content?.aspectRatio || "16:9"}
            onValueChange={(value) => handleChange("aspectRatio", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Padrão)</SelectItem>
              <SelectItem value="4:3">4:3</SelectItem>
              <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Fallback genérico
  return (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
      Editor não implementado para: <strong>{component.type}</strong>
    </div>
  );
};
