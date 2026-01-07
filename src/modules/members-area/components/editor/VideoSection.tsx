/**
 * VideoSection - Video upload and YouTube embedding
 * Kiwify-style with tabs for different video sources
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Upload, 
  Library, 
  RefreshCw, 
  Youtube, 
  X,
  ExternalLink
} from "lucide-react";

interface VideoSectionProps {
  videoUrl: string | null;
  onVideoUrlChange: (url: string | null) => void;
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

export function VideoSection({ videoUrl, onVideoUrlChange }: VideoSectionProps) {
  const [youtubeInput, setYoutubeInput] = useState(videoUrl || "");
  const [activeTab, setActiveTab] = useState<string>("new");

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
            {/* Drop Zone Placeholder */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Arraste um vídeo aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                MP4, WebM, MOV • Máximo 2GB
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
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Library className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Biblioteca de vídeos em breve
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Selecione vídeos já enviados anteriormente
              </p>
            </div>
          </TabsContent>

          <TabsContent value="reuse" className="mt-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Reutilizar vídeo de outra aula
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Use um vídeo já existente em outro conteúdo
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
