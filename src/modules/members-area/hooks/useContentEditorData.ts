/**
 * ContentEditorView - Data Fetching Hook
 * 
 * Responsible for:
 * - Load content, attachments, release settings
 * - Load module contents for after_content selection
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ReleaseFormData, ContentAttachment, MemberContent } from "../types";

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
  after_content_id: null,
};

interface UseContentEditorDataProps {
  isNew: boolean;
  contentId: string | null;
  moduleId: string | null;
  onBack: () => void;
}

interface UseContentEditorDataReturn {
  isLoading: boolean;
  content: ContentState;
  setContent: React.Dispatch<React.SetStateAction<ContentState>>;
  release: ReleaseFormData;
  setRelease: React.Dispatch<React.SetStateAction<ReleaseFormData>>;
  attachments: ContentAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<ContentAttachment[]>>;
  moduleContents: Pick<MemberContent, "id" | "title">[];
}

/**
 * Data fetching hook for Content Editor
 */
export function useContentEditorData({
  isNew,
  contentId,
  moduleId,
  onBack,
}: UseContentEditorDataProps): UseContentEditorDataReturn {
  const [isLoading, setIsLoading] = useState(!isNew);
  const [content, setContent] = useState<ContentState>(DEFAULT_CONTENT);
  const [release, setRelease] = useState<ReleaseFormData>(DEFAULT_RELEASE);
  const [attachments, setAttachments] = useState<ContentAttachment[]>([]);
  const [moduleContents, setModuleContents] = useState<Pick<MemberContent, "id" | "title">[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Always fetch module contents for after_content selection
      if (moduleId) {
        const { data: contentsData } = await supabase
          .from("product_member_content")
          .select("id, title")
          .eq("module_id", moduleId)
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (contentsData) {
          setModuleContents(contentsData);
        }
      }

      if (isNew || !contentId) {
        setIsLoading(false);
        return;
      }

      // Fetch content data
      const { data: contentData, error: contentError } = await supabase
        .from("product_member_content")
        .select("*")
        .eq("id", contentId)
        .single();

      if (contentError) {
        console.error("[useContentEditorData] Error loading content:", contentError);
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
      const { data: releaseData } = await supabase
        .from("content_release_settings")
        .select("*")
        .eq("content_id", contentId)
        .maybeSingle();

      if (releaseData) {
        setRelease({
          release_type: releaseData.release_type as ReleaseFormData["release_type"],
          days_after_purchase: releaseData.days_after_purchase,
          fixed_date: releaseData.fixed_date,
          after_content_id: releaseData.after_content_id,
        });
      }
    } catch (err) {
      console.error("[useContentEditorData] Exception:", err);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setIsLoading(false);
    }
  }, [isNew, contentId, moduleId, onBack]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isLoading,
    content,
    setContent,
    release,
    setRelease,
    attachments,
    setAttachments,
    moduleContents,
  };
}
