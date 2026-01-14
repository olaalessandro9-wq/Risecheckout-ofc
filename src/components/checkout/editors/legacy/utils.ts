/**
 * Legacy Component Editor - Utilidades
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { sanitizeText, sanitizeUrl, sanitizeColor } from "@/lib/security";
import type { CheckoutComponent } from "@/types/checkoutEditor";
import type { ImageContent } from "./types";

// Campos que são URLs
export const URL_FIELDS = ['imageUrl', 'videoUrl', 'url', 'avatar', 'src'];

// Campos que são cores
export const COLOR_FIELDS = ['color', 'backgroundColor', 'textColor', 'iconColor', 'borderColor', 'timerColor'];

// Campos que são texto simples (sem HTML)
export const TEXT_FIELDS = ['text', 'title', 'description', 'name', 'activeText', 'finishedText', 'topText', 'subtitle'];

/**
 * Cria um handler genérico com sanitização XSS
 */
export function createChangeHandler(
  component: CheckoutComponent,
  onUpdate: (id: string, content: Record<string, unknown>) => void
) {
  return (field: string, value: unknown) => {
    let sanitizedValue = value;
    const rawContent = component.content as Record<string, unknown> | undefined;
    
    // Sanitiza baseado no tipo de campo
    if (typeof value === 'string') {
      if (URL_FIELDS.includes(field)) {
        sanitizedValue = sanitizeUrl(value);
      } else if (COLOR_FIELDS.includes(field) || field.toLowerCase().includes('color')) {
        const defaultColor = (rawContent?.[field] as string) || '#000000';
        sanitizedValue = sanitizeColor(value, defaultColor);
      } else if (TEXT_FIELDS.includes(field)) {
        sanitizedValue = sanitizeText(value);
      }
    }
    
    onUpdate(component.id, { ...rawContent, [field]: sanitizedValue });
  };
}

/**
 * Cria um handler de upload de imagem
 */
export function createImageUploadHandler(
  component: CheckoutComponent,
  onUpdate: (id: string, content: Record<string, unknown>) => void
) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      alert("Arquivo inválido (deve ser imagem < 10MB)");
      return;
    }

    const imageContent = component.content as ImageContent | undefined;
    const previewUrl = URL.createObjectURL(file);
    
    // 1. Preview imediato
    onUpdate(component.id, {
      ...imageContent,
      imageUrl: previewUrl,
      _preview: true,
      _uploading: true,
      _fileName: file.name,
      _old_storage_path: imageContent?._storage_path,
    });

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `checkout-components/${component.id}-${Date.now()}.${fileExt}`;

      const { publicUrl, error } = await uploadViaEdge(
        "product-images",
        fileName,
        file,
        { upsert: true }
      );

      if (error) throw error;

      // 2. Sucesso
      onUpdate(component.id, {
        ...imageContent,
        imageUrl: publicUrl,
        url: publicUrl,
        _storage_path: fileName,
        _uploading: false,
        _preview: false,
      });
    } catch (err) {
      console.error(err);
      onUpdate(component.id, { ...imageContent, _uploading: false, _uploadError: true });
      alert("Erro ao enviar imagem");
    }
  };
}
