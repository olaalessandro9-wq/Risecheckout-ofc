/**
 * ContentEditorView - Data Fetching Hook
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
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
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
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
 * MIGRATED: Uses Edge Function instead of supabase.from()
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
      const sessionToken = getProducerSessionToken();
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { 
          action: "content-editor-data",
          contentId,
          moduleId,
          isNew,
        },
        headers: { "x-producer-session-token": sessionToken || "" },
      });

      if (error) {
        console.error("[useContentEditorData] Error loading content:", error);
        toast.error("Erro ao carregar conteúdo");
        onBack();
        return;
      }

      // Set module contents for after_content selection
      if (data?.moduleContents) {
        setModuleContents(data.moduleContents);
      }

      // If new, stop here
      if (isNew || !contentId) {
        setIsLoading(false);
        return;
      }

      // Set content data
      if (data?.content) {
        setContent({
          title: data.content.title,
          video_url: data.content.content_url,
          body: data.content.body,
        });
      }

      // Set attachments
      if (data?.attachments) {
        setAttachments(data.attachments as ContentAttachment[]);
      }

      // Set release settings
      if (data?.release) {
        setRelease({
          release_type: data.release.release_type as ReleaseFormData["release_type"],
          days_after_purchase: data.release.days_after_purchase,
          fixed_date: data.release.fixed_date,
          after_content_id: data.release.after_content_id,
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
