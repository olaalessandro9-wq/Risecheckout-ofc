/**
 * useVideoLibrary - Hook para buscar vídeos já usados no produto
 * 
 * Implementa as funcionalidades:
 * - Biblioteca: Lista de vídeos únicos usados no produto
 * - Reutilizar: Lista de conteúdos que possuem vídeo
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string;
  moduleTitle: string;
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

  const fetchVideos = useCallback(async (productId: string, excludeContentId?: string) => {
    if (!productId) return;

    setIsLoading(true);
    try {
      // Buscar todos os conteúdos com vídeo do produto
      const { data, error } = await supabase
        .from("product_member_content")
        .select(`
          id,
          title,
          content_url,
          module:module_id (
            id,
            title,
            product_id
          )
        `)
        .not("content_url", "is", null)
        .eq("is_active", true);

      if (error) {
        console.error("[useVideoLibrary] Error fetching videos:", error);
        return;
      }

      // Filtrar por product_id e mapear
      const videoItems: VideoItem[] = [];
      const seenUrls = new Set<string>();

      for (const item of data || []) {
        const module = item.module as { id: string; title: string; product_id: string } | null;
        
        // Filtrar pelo produto
        if (!module || module.product_id !== productId) continue;
        
        // Excluir conteúdo atual (se estiver editando)
        if (excludeContentId && item.id === excludeContentId) continue;
        
        // Verificar se é URL do YouTube
        if (!item.content_url) continue;
        
        const youtubeId = extractYouTubeId(item.content_url);
        if (!youtubeId) continue;

        // Evitar duplicatas de URL
        if (seenUrls.has(item.content_url)) continue;
        seenUrls.add(item.content_url);

        videoItems.push({
          id: item.id,
          url: item.content_url,
          thumbnail: getYouTubeThumbnail(youtubeId),
          title: item.title,
          moduleTitle: module.title,
        });
      }

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
