/**
 * useAttachmentUpload - Hook para upload de anexos para Supabase Storage
 * 
 * Gerencia:
 * - Upload de arquivos para bucket member-content
 * - Progresso de upload
 * - Salvamento de metadados na tabela content_attachments
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ContentAttachment } from "../types";

interface UseAttachmentUploadReturn {
  isUploading: boolean;
  uploadProgress: number;
  uploadAttachments: (
    productId: string,
    contentId: string,
    attachments: ContentAttachment[]
  ) => Promise<ContentAttachment[]>;
  deleteAttachment: (productId: string, attachment: ContentAttachment) => Promise<boolean>;
}

/**
 * Gera nome único para arquivo
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").slice(0, 50);
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${sanitized}_${timestamp}_${random}.${ext}`;
}

export function useAttachmentUpload(): UseAttachmentUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Faz upload dos anexos temporários para o Supabase Storage
   * e salva os metadados na tabela content_attachments
   */
  const uploadAttachments = useCallback(async (
    productId: string,
    contentId: string,
    attachments: ContentAttachment[]
  ): Promise<ContentAttachment[]> => {
    if (!productId || !contentId || attachments.length === 0) {
      return attachments;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedAttachments: ContentAttachment[] = [];
    const tempAttachments = attachments.filter(a => a.id.startsWith("temp-"));
    const existingAttachments = attachments.filter(a => !a.id.startsWith("temp-"));

    // Manter anexos existentes
    uploadedAttachments.push(...existingAttachments);

    const totalFiles = tempAttachments.length;
    let completedFiles = 0;

    try {
      for (const attachment of tempAttachments) {
        // Converter blob URL para File
        const response = await fetch(attachment.file_url);
        const blob = await response.blob();
        const file = new File([blob], attachment.file_name, { type: attachment.file_type });

        // Gerar path único
        const fileName = generateFileName(attachment.file_name);
        const filePath = `${productId}/attachments/${contentId}/${fileName}`;

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("member-content")
          .upload(filePath, file, {
            contentType: attachment.file_type,
            upsert: false,
          });

        if (uploadError) {
          console.error("[useAttachmentUpload] Upload error:", uploadError);
          toast.error(`Erro ao enviar: ${attachment.file_name}`);
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("member-content")
          .getPublicUrl(filePath);

        // Salvar metadados na tabela
        const { data: savedAttachment, error: saveError } = await supabase
          .from("content_attachments")
          .insert({
            content_id: contentId,
            file_name: attachment.file_name,
            file_url: urlData.publicUrl,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            position: attachment.position,
          })
          .select()
          .single();

        if (saveError) {
          console.error("[useAttachmentUpload] Save error:", saveError);
          // Tentar deletar arquivo órfão
          await supabase.storage.from("member-content").remove([filePath]);
          continue;
        }

        uploadedAttachments.push(savedAttachment as ContentAttachment);

        // Revogar blob URL para liberar memória
        URL.revokeObjectURL(attachment.file_url);

        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }

      if (completedFiles > 0) {
        toast.success(`${completedFiles} anexo(s) enviado(s) com sucesso`);
      }

      return uploadedAttachments;
    } catch (err) {
      console.error("[useAttachmentUpload] Exception:", err);
      toast.error("Erro ao enviar anexos");
      return attachments;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  /**
   * Deleta um anexo do Storage e da tabela
   */
  const deleteAttachment = useCallback(async (
    productId: string,
    attachment: ContentAttachment
  ): Promise<boolean> => {
    // Se é temporário, só precisa revogar o blob
    if (attachment.id.startsWith("temp-")) {
      URL.revokeObjectURL(attachment.file_url);
      return true;
    }

    try {
      // Extrair path do storage a partir da URL
      const url = new URL(attachment.file_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/member-content\/(.+)/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        await supabase.storage.from("member-content").remove([filePath]);
      }

      // Deletar da tabela
      const { error } = await supabase
        .from("content_attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) {
        console.error("[useAttachmentUpload] Delete error:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[useAttachmentUpload] Delete exception:", err);
      return false;
    }
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadAttachments,
    deleteAttachment,
  };
}
