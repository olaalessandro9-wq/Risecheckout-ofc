/**
 * ContentEditorView - Data Fetching Hook
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 * 
 * Responsible for:
 * - Load content, attachments, release settings
 * - Load module contents for after_content selection
 * 
 * @see RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("ContentEditorData");
import type { ReleaseFormData, ContentAttachment, MemberContent } from "../types";

interface ContentEditorDataResponse {
  moduleContents?: Pick<MemberContent, "id" | "title">[];
  content?: {
    title: string;
    content_url?: string | null;
    body?: string | null;
  };
  attachments?: ContentAttachment[];
  release?: {
    release_type: string;
    days_after_purchase?: number | null;
    fixed_date?: string | null;
    after_content_id?: string | null;
  };
  error?: string;
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
      const { data, error } = await api.call<ContentEditorDataResponse>("admin-data", {
        action: "content-editor-data",
        contentId,
        moduleId,
        isNew,
      });

      if (error) {
        log.error("Error loading content:", error);
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
      log.error("Exception:", err);
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
