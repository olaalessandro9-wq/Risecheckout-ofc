/**
 * ContentEditorView - Kiwify-style content editor
 * 
 * Full page experience with:
 * - Video section (YouTube/upload)
 * - Rich text editor
 * - Multiple attachments
 * - Release settings
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  TitleSection,
  VideoSection,
  RichTextEditor,
  AttachmentsSection,
  ReleaseSection,
  ContentEditorHeader,
} from "../components/editor";
import { useDripSettings } from "../hooks/useDripSettings";
import type { ReleaseFormData, ContentAttachment } from "../types";

interface ContentEditorViewProps {
  productId?: string;
  onBack: () => void;
  onSave: () => void;
}

interface ContentState {
  title: string;
  video_url: string | null;
  body: string | null;
}

const DEFAULT_CONTENT: ContentState = {
  title: "",
  video_url: null,
  body: null,
};

const DEFAULT_RELEASE: ReleaseFormData = {
  release_type: "immediate",
  days_after_purchase: null,
  fixed_date: null,
};

export function ContentEditorView({ productId, onBack, onSave }: ContentEditorViewProps) {
  const [searchParams] = useSearchParams();
  const { fetchDripSettings, saveDripSettings, isLoading: isDripLoading } = useDripSettings();

  // Get params from URL
  const mode = searchParams.get("mode");
  const contentId = searchParams.get("contentId");
  const moduleId = searchParams.get("moduleId");
  const isNew = mode === "new";

  // State
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<ContentState>(DEFAULT_CONTENT);
  const [release, setRelease] = useState<ReleaseFormData>(DEFAULT_RELEASE);
  const [attachments, setAttachments] = useState<ContentAttachment[]>([]);

  // Fetch existing content if editing
  useEffect(() => {
    if (isNew || !contentId) {
      setIsLoading(false);
      return;
    }

    async function loadContent() {
      setIsLoading(true);
      try {
        // Fetch content data
        const { data: contentData, error: contentError } = await supabase
          .from("product_member_content")
          .select("*")
          .eq("id", contentId)
          .single();

        if (contentError) {
          console.error("[ContentEditorView] Error loading content:", contentError);
          toast.error("Erro ao carregar conteúdo");
          onBack();
          return;
        }

        setContent({
          title: contentData.title,
          video_url: contentData.content_url,
          body: contentData.body,
        });

        // Fetch attachments
        const { data: attachmentsData } = await supabase
          .from("content_attachments")
          .select("*")
          .eq("content_id", contentId)
          .order("position", { ascending: true });

        if (attachmentsData) {
          setAttachments(attachmentsData as ContentAttachment[]);
        }

        // Fetch release settings
        const releaseData = await fetchDripSettings(contentId);
        if (releaseData) {
          setRelease({
            release_type: releaseData.release_type as ReleaseFormData["release_type"],
            days_after_purchase: releaseData.days_after_purchase,
            fixed_date: releaseData.fixed_date,
          });
        }
      } catch (err) {
        console.error("[ContentEditorView] Exception:", err);
        toast.error("Erro ao carregar conteúdo");
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [isNew, contentId, fetchDripSettings, onBack]);

  // Validate form
  const canSave = useMemo(() => {
    if (!content.title.trim()) return false;
    if (!moduleId) return false;

    // Validate release settings
    if (release.release_type === "days_after_purchase" && !release.days_after_purchase) return false;
    if (release.release_type === "fixed_date" && !release.fixed_date) return false;

    return true;
  }, [content, release, moduleId]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!canSave || !moduleId) return;

    setIsSaving(true);
    try {
      let savedContentId = contentId;

      if (isNew) {
        // Create new content
        const { data: newContent, error: createError } = await supabase
          .from("product_member_content")
          .insert({
            module_id: moduleId,
            title: content.title,
            content_type: "mixed", // New type for Kiwify-style content
            content_url: content.video_url,
            body: content.body,
            is_active: true,
          })
          .select("id")
          .single();

        if (createError) {
          console.error("[ContentEditorView] Create error:", createError);
          toast.error("Erro ao criar conteúdo");
          return;
        }

        savedContentId = newContent.id;
      } else if (contentId) {
        // Update existing content
        const { error: updateError } = await supabase
          .from("product_member_content")
          .update({
            title: content.title,
            content_url: content.video_url,
            body: content.body,
          })
          .eq("id", contentId);

        if (updateError) {
          console.error("[ContentEditorView] Update error:", updateError);
          toast.error("Erro ao atualizar conteúdo");
          return;
        }
      }

      // Save attachments (simplified - full implementation would handle uploads)
      if (savedContentId) {
        // Delete removed attachments (those not in current list)
        const currentIds = attachments.filter(a => !a.id.startsWith("temp-")).map(a => a.id);
        if (currentIds.length > 0) {
          await supabase
            .from("content_attachments")
            .delete()
            .eq("content_id", savedContentId)
            .not("id", "in", `(${currentIds.join(",")})`);
        }

        // Save release settings
        const dripData = {
          release_type: release.release_type,
          days_after_purchase: release.days_after_purchase,
          fixed_date: release.fixed_date,
          after_content_id: null,
        };
        
        const dripSaved = await saveDripSettings(savedContentId, dripData);
        if (!dripSaved) {
          toast.error("Erro ao salvar configurações de liberação");
        }
      }

      toast.success(isNew ? "Conteúdo criado com sucesso!" : "Conteúdo atualizado com sucesso!");
      onSave();
    } catch (err) {
      console.error("[ContentEditorView] Save exception:", err);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isNew, moduleId, contentId, content, release, attachments, saveDripSettings, onSave]);

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
        isSaving={isSaving || isDripLoading}
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
          isLoading={isSaving}
        />

        {/* Release Settings */}
        <ReleaseSection
          settings={release}
          onSettingsChange={handleReleaseChange}
        />
      </div>
    </div>
  );
}
