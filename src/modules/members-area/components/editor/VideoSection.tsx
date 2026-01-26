/**
 * VideoSection - Video upload and YouTube embedding
 * Kiwify-style with tabs for different video sources
 * 
 * Features:
 * - YouTube link input
 * - Biblioteca (Library): Shows YouTube videos used in product
 * - Reutilizar (Reuse): Shows contents with videos to reuse
 */

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Video, 
  Upload, 
  Library, 
  RefreshCw, 
  Youtube, 
  X,
  ExternalLink,
  Loader2,
  Check
} from "lucide-react";
import { useVideoLibrary } from "../../hooks/useVideoLibrary";

interface VideoSectionProps {
  videoUrl: string | null;
  onVideoUrlChange: (url: string | null) => void;
  productId?: string;
  currentContentId?: string;
}

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

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export function VideoSection({ 
  videoUrl, 
  onVideoUrlChange, 
  productId,
  currentContentId 
}: VideoSectionProps) {
  const [youtubeInput, setYoutubeInput] = useState(videoUrl || "");
  const [activeTab, setActiveTab] = useState<string>("new");
  const { videos, isLoading: isLoadingLibrary, fetchVideos } = useVideoLibrary();

  // Fetch library videos when switching to those tabs
  useEffect(() => {
    if ((activeTab === "library" || activeTab === "reuse") && productId) {
      fetchVideos(productId, currentContentId);
    }
  }, [activeTab, productId, currentContentId, fetchVideos]);

  const handleYouTubeSubmit = useCallback(() => {
    if (!youtubeInput.trim()) return;
    
    const videoId = extractYouTubeId(youtubeInput);
    if (videoId) {
      onVideoUrlChange(`https://www.youtube.com/embed/${videoId}`);
    } else {
      onVideoUrlChange(youtubeInput);
    }
  }, [youtubeInput, onVideoUrlChange]);

  const handleClearVideo = useCallback(() => {
    setYoutubeInput("");
    onVideoUrlChange(null);
  }, [onVideoUrlChange]);

  const handleSelectVideo = useCallback((url: string) => {
    onVideoUrlChange(url);
    setYoutubeInput(url);
  }, [onVideoUrlChange]);

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const hasVideo = !!videoUrl;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Vídeo</h3>
      </div>

      {hasVideo ? (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden bg-muted">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
          
          {/* Video Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isYouTubeUrl(videoUrl || "") ? (
                <Youtube className="h-4 w-4 text-red-500" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span className="truncate max-w-md">{videoUrl}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearVideo}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" className="gap-2">
              <Upload className="h-4 w-4" />
              Novo vídeo
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <Library className="h-4 w-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="reuse" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reutilizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-4">
            {/* Drop Zone Placeholder - Upload disabled */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center opacity-50">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Upload de vídeo em breve
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Use links do YouTube ou Vimeo
              </p>
              <Button variant="outline" className="mt-4" disabled>
                Selecionar Arquivo
              </Button>
            </div>

            {/* YouTube Input */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  ou use um vídeo do YouTube
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube-url" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                URL do YouTube
              </Label>
              <div className="flex gap-2">
                <Input
                  id="youtube-url"
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleYouTubeSubmit}
                  disabled={!youtubeInput.trim()}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            {isLoadingLibrary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Library className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhum vídeo encontrado
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Adicione vídeos do YouTube aos seus conteúdos
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video.url)}
                      className="group relative rounded-lg overflow-hidden border hover:border-primary transition-colors text-left"
                    >
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full aspect-video object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Check className="h-8 w-8 text-white" />
                      </div>
                      <div className="p-2 bg-muted/50">
                        <p className="text-xs font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {video.moduleTitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="reuse" className="mt-4">
            {isLoadingLibrary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhum conteúdo com vídeo
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Adicione vídeos aos seus conteúdos primeiro
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video.url)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors text-left"
                    >
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-20 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Módulo: {video.moduleTitle}
                        </p>
                      </div>
                      <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
