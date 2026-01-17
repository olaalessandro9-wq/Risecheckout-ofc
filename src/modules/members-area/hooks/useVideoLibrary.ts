/**
 * useVideoLibrary - Hook para buscar vídeos já usados no produto
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke
 * @see RISE Protocol V2 - Zero direct database access from frontend
 * 
 * Implementa as funcionalidades:
 * - Biblioteca: Lista de vídeos únicos usados no produto
 * - Reutilizar: Lista de conteúdos que possuem vídeo
 */

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface VideoItem {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  moduleTitle: string;
}

interface VideoLibraryResponse {
  videos?: Array<{ id: string; url: string; title: string; moduleTitle: string }>;
  error?: string;
}

interface UseVideoLibraryReturn {
  videos: VideoItem[];
  isLoading: boolean;
  fetchVideos: (productId: string, excludeContentId?: string) => Promise<void>;
}

/**
 * Extrai ID do YouTube de uma URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Gera URL do thumbnail do YouTube
 */
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function useVideoLibrary(): UseVideoLibraryReturn {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch videos via api.call()
   */
  const fetchVideos = useCallback(async (productId: string, excludeContentId?: string) => {
    if (!productId) return;

    setIsLoading(true);
    try {
      const { data, error } = await api.call<VideoLibraryResponse>("products-crud", {
        action: "get-video-library",
        productId,
        excludeContentId,
      });

      if (error) {
        console.error("[useVideoLibrary] Error fetching videos:", error);
        return;
      }

      // Map videos with thumbnails
      const videoItems: VideoItem[] = (data?.videos || []).map((item) => {
        const youtubeId = extractYouTubeId(item.url);
        return {
          id: item.id,
          url: item.url,
          thumbnail: youtubeId ? getYouTubeThumbnail(youtubeId) : null,
          title: item.title,
          moduleTitle: item.moduleTitle,
        };
      });

      setVideos(videoItems);
    } catch (err) {
      console.error("[useVideoLibrary] Exception:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    videos,
    isLoading,
    fetchVideos,
  };
}
