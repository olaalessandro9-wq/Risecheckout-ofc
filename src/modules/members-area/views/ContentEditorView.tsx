/**
 * ContentEditorView - Kiwify-style content editor
 * 
 * Full page experience with:
 * - Video section (YouTube/upload)
 * - Rich text editor
 * - Multiple attachments with real upload
 * - Release settings with after_content support
 * 
 * Uses members-area-content Edge Function for atomic save
 * 
 * @see RISE ARCHITECT PROTOCOL - Refactored using useContentEditorData hook
 */

import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  TitleSection,
  VideoSection,
  RichTextEditor,
  AttachmentsSection,
  ReleaseSection,
  ContentEditorHeader,
} from "../components/editor";
import { useContentEditorData } from "../hooks/useContentEditorData";
import type { ReleaseFormData, ContentAttachment } from "../types";

interface ContentEditorViewProps {
  productId?: string;
  onBack: () => void;
  onSave: () => void;
}

export function ContentEditorView({ productId, onBack, onSave }: ContentEditorViewProps) {
  const [searchParams] = useSearchParams();

  // Get params from URL
  const mode = searchParams.get("mode");
  const contentId = searchParams.get("contentId");
  const moduleId = searchParams.get("moduleId");
  const isNew = mode === "new";

  // Use extracted data hook
  const {
    isLoading,
    content,
    setContent,
    release,
    setRelease,
    attachments,
    setAttachments,
    moduleContents,
  } = useContentEditorData({ isNew, contentId, moduleId, onBack });

  // Validate form
  const canSave = useMemo(() => {
    if (!content.title.trim()) return false;
    if (!moduleId) return false;

    // Validate release settings
    if (release.release_type === "days_after_purchase" && !release.days_after_purchase) return false;
    if (release.release_type === "fixed_date" && !release.fixed_date) return false;
    if (release.release_type === "after_content" && !release.after_content_id) return false;

    return true;
  }, [content, release, moduleId]);

  // Handle save via Edge Function (atomic operation)
  const handleSave = useCallback(async () => {
    if (!canSave || !moduleId || !productId) return;

    try {
      // Prepare attachments for Edge Function
      // For temp attachments, we need to convert blob URLs to base64
      const preparedAttachments = await Promise.all(
        attachments.map(async (att) => {
          if (att.id.startsWith("temp-") && att.file_url.startsWith("blob:")) {
            // Convert blob to base64 for upload
            const response = await fetch(att.file_url);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            // Revoke blob URL
            URL.revokeObjectURL(att.file_url);
            
            return {
              ...att,
              file_data: base64,
              is_temp: true,
            };
          }
          return { ...att, is_temp: false };
        })
      );

      const { data: result, error } = await api.call<{ success?: boolean; error?: string }>("content-save", {
        action: "save-full",
        productId,
        moduleId,
        contentId: isNew ? null : contentId,
        content: {
          title: content.title,
          video_url: content.video_url,
          body: content.body,
        },
        attachments: preparedAttachments,
        release,
      });

      if (error) throw new Error(error.message);
      if (!result?.success) throw new Error(result?.error || "Failed to save content");

      toast.success(isNew ? "Conteúdo criado com sucesso!" : "Conteúdo atualizado com sucesso!");
      onSave();
    } catch (err) {
      console.error("[ContentEditorView] Save exception:", err);
      toast.error("Erro ao salvar conteúdo");
    }
  }, [canSave, isNew, moduleId, contentId, content, release, attachments, onSave, productId]);

  // Handlers
  const handleTitleChange = (value: string) => {
    setContent((prev) => ({ ...prev, title: value }));
  };

  const handleVideoUrlChange = (value: string | null) => {
    setContent((prev) => ({ ...prev, video_url: value }));
  };

  const handleBodyChange = (value: string) => {
    setContent((prev) => ({ ...prev, body: value || null }));
  };

  const handleReleaseChange = (settings: ReleaseFormData) => {
    setRelease(settings);
  };

  const handleAttachmentsChange = (newAttachments: ContentAttachment[]) => {
    setAttachments(newAttachments);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ContentEditorHeader
        isNew={isNew}
        isSaving={false}
        canSave={canSave}
        onBack={onBack}
        onCancel={onBack}
        onSave={handleSave}
      />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header Info */}
        <div>
          <h2 className="text-xl font-semibold">Detalhes do conteúdo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o vídeo, texto e materiais complementares da sua aula
          </p>
        </div>

        {/* Title */}
        <div className="rounded-lg border bg-card p-6">
          <TitleSection
            title={content.title}
            onTitleChange={handleTitleChange}
          />
        </div>

        {/* Video */}
        <VideoSection
          videoUrl={content.video_url}
          onVideoUrlChange={handleVideoUrlChange}
          productId={productId}
          currentContentId={contentId || undefined}
        />

        {/* Rich Text Editor */}
        <RichTextEditor
          content={content.body}
          onChange={handleBodyChange}
        />

        {/* Attachments */}
        <AttachmentsSection
          attachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
          isLoading={false}
          uploadProgress={0}
        />

        {/* Release Settings */}
        <ReleaseSection
          settings={release}
          onSettingsChange={handleReleaseChange}
          availableContents={moduleContents}
          currentContentId={contentId || undefined}
        />
      </div>
    </div>
  );
}
