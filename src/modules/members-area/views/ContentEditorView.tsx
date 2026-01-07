/**
 * ContentEditorView - Dedicated page for creating/editing content
 * 
 * Replaces the modal-based approach with a full page experience
 * including drip content settings
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ContentBasicInfo,
  ContentMediaSection,
  ContentDescription,
  DripContentSection,
  ContentEditorHeader,
} from "../components/editor";
import { useDripSettings } from "../hooks/useDripSettings";
import type { ContentType, ReleaseType, DripFormData, MemberContent } from "../types";

interface ContentEditorViewProps {
  productId?: string;
  onBack: () => void;
  onSave: () => void;
}

interface ContentState {
  title: string;
  description: string | null;
  content_type: ContentType;
  content_url: string | null;
  body: string | null;
}

const DEFAULT_CONTENT: ContentState = {
  title: "",
  description: null,
  content_type: "video",
  content_url: null,
  body: null,
};

const DEFAULT_DRIP: DripFormData = {
  release_type: "immediate",
  days_after_purchase: null,
  fixed_date: null,
  after_content_id: null,
};

export function ContentEditorView({ productId, onBack, onSave }: ContentEditorViewProps) {
  const [searchParams] = useSearchParams();
  const { fetchDripSettings, saveDripSettings, isLoading: isDripLoading } = useDripSettings();

  // Get params from URL
  const mode = searchParams.get("mode"); // "new" or "edit"
  const contentId = searchParams.get("contentId");
  const moduleId = searchParams.get("moduleId");
  const isNew = mode === "new";

  // State
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<ContentState>(DEFAULT_CONTENT);
  const [drip, setDrip] = useState<DripFormData>(DEFAULT_DRIP);
  const [allContents, setAllContents] = useState<MemberContent[]>([]);

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
          description: contentData.description,
          content_type: contentData.content_type as ContentType,
          content_url: contentData.content_url,
          body: contentData.body,
        });

        // Fetch drip settings
        const dripData = await fetchDripSettings(contentId);
        if (dripData) {
          setDrip(dripData);
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

  // Fetch all contents for "after_content" dropdown
  useEffect(() => {
    if (!productId) return;

    async function loadAllContents() {
      const { data, error } = await supabase
        .from("product_member_content")
        .select("id, title, module_id, position")
        .eq("module_id", moduleId)
        .order("position", { ascending: true });

      if (!error && data) {
        setAllContents(data as MemberContent[]);
      }
    }

    loadAllContents();
  }, [productId, moduleId]);

  // Validate form
  const canSave = useMemo(() => {
    if (!content.title.trim()) return false;
    if (!moduleId) return false;

    // For text type, body is required
    if (content.content_type === "text" && !content.body?.trim()) return false;

    // Validate drip settings
    if (drip.release_type === "days_after_purchase" && !drip.days_after_purchase) return false;
    if (drip.release_type === "fixed_date" && !drip.fixed_date) return false;
    if (drip.release_type === "after_content" && !drip.after_content_id) return false;

    return true;
  }, [content, drip, moduleId]);

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
            description: content.description,
            content_type: content.content_type,
            content_url: content.content_url,
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
        toast.success("Conteúdo criado com sucesso!");
      } else if (contentId) {
        // Update existing content
        const { error: updateError } = await supabase
          .from("product_member_content")
          .update({
            title: content.title,
            description: content.description,
            content_type: content.content_type,
            content_url: content.content_url,
            body: content.body,
          })
          .eq("id", contentId);

        if (updateError) {
          console.error("[ContentEditorView] Update error:", updateError);
          toast.error("Erro ao atualizar conteúdo");
          return;
        }

        toast.success("Conteúdo atualizado com sucesso!");
      }

      // Save drip settings
      if (savedContentId) {
        const dripSaved = await saveDripSettings(savedContentId, drip);
        if (!dripSaved) {
          toast.error("Erro ao salvar configurações de liberação");
        }
      }

      onSave();
    } catch (err) {
      console.error("[ContentEditorView] Save exception:", err);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isNew, moduleId, contentId, content, drip, saveDripSettings, onSave]);

  // Handlers
  const handleTitleChange = (value: string) => {
    setContent((prev) => ({ ...prev, title: value }));
  };

  const handleContentTypeChange = (value: ContentType) => {
    setContent((prev) => ({ ...prev, content_type: value }));
  };

  const handleContentUrlChange = (value: string) => {
    setContent((prev) => ({ ...prev, content_url: value || null }));
  };

  const handleDescriptionChange = (value: string) => {
    setContent((prev) => ({ ...prev, description: value || null }));
  };

  const handleBodyChange = (value: string) => {
    setContent((prev) => ({ ...prev, body: value || null }));
  };

  const handleDripChange = (settings: DripFormData) => {
    setDrip(settings);
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
        <ContentBasicInfo
          title={content.title}
          contentType={content.content_type}
          onTitleChange={handleTitleChange}
          onContentTypeChange={handleContentTypeChange}
        />

        <ContentMediaSection
          contentType={content.content_type}
          contentUrl={content.content_url}
          onContentUrlChange={handleContentUrlChange}
        />

        <ContentDescription
          contentType={content.content_type}
          description={content.description}
          body={content.body}
          onDescriptionChange={handleDescriptionChange}
          onBodyChange={handleBodyChange}
        />

        <DripContentSection
          settings={drip}
          availableContents={allContents}
          currentContentId={contentId || undefined}
          onSettingsChange={handleDripChange}
        />
      </div>
    </div>
  );
}
