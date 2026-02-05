/**
 * useImageDragDrop - Hook reutilizável para drag-and-drop de imagens
 * 
 * Encapsula a lógica de arrastar e soltar imagens,
 * incluindo validação de tipo e tamanho de arquivo.
 * Usado por ImageUploadWithCrop e ModuleImageUploadSection.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseImageDragDropOptions {
  /** Tipos MIME aceitos (ex: ['image/jpeg', 'image/png']) */
  acceptedTypes: string[];
  /** Tamanho máximo em MB */
  maxSizeMB: number;
  /** Callback executado quando um arquivo válido é recebido */
  onValidFile: (file: File) => void;
  /** Desabilita interações de drag-and-drop */
  disabled?: boolean;
}

interface UseImageDragDropReturn {
  /** Se o usuário está arrastando um arquivo sobre a área */
  isDragging: boolean;
  /** Valida um arquivo contra os critérios configurados */
  validateFile: (file: File) => boolean;
  /** Props para aplicar no elemento drop zone */
  dragProps: {
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
  };
}

/**
 * Hook para gerenciar drag-and-drop de imagens com validação.
 * 
 * @example
 * const { isDragging, validateFile, dragProps } = useImageDragDrop({
 *   acceptedTypes: ['image/jpeg', 'image/png'],
 *   maxSizeMB: 10,
 *   onValidFile: (file) => openCropDialog(file),
 * });
 * 
 * <div {...dragProps} className={isDragging ? 'border-primary' : ''}>
 *   Drop zone
 * </div>
 */
export function useImageDragDrop({
  acceptedTypes,
  maxSizeMB,
  onValidFile,
  disabled = false,
}: UseImageDragDropOptions): UseImageDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (!acceptedTypes.includes(file.type)) {
        toast.error("Formato inválido. Use JPG, PNG, WebP ou GIF.");
        return false;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo ${maxSizeMB}MB.`);
        return false;
      }

      return true;
    },
    [acceptedTypes, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file && validateFile(file)) {
        onValidFile(file);
      }
    },
    [disabled, validateFile, onValidFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    validateFile,
    dragProps: {
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
    },
  };
}
