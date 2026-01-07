/**
 * ContentMediaSection - Section for content URL/media input
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Youtube, FileVideo, Link2 } from "lucide-react";
import type { ContentType } from "../../types";

interface ContentMediaSectionProps {
  contentType: ContentType;
  contentUrl: string | null;
  onContentUrlChange: (value: string) => void;
}

function getUrlPlaceholder(contentType: ContentType): string {
  switch (contentType) {
    case "video":
      return "https://www.youtube.com/watch?v=... ou https://vimeo.com/...";
    case "pdf":
      return "https://exemplo.com/documento.pdf";
    case "download":
      return "https://exemplo.com/arquivo.zip";
    case "live":
      return "https://meet.google.com/... ou link da live";
    default:
      return "https://...";
  }
}

function getUrlLabel(contentType: ContentType): string {
  switch (contentType) {
    case "video":
      return "URL do Vídeo";
    case "pdf":
      return "URL do PDF";
    case "download":
      return "URL do Arquivo";
    case "live":
      return "URL da Live";
    default:
      return "URL";
  }
}

function getUrlTip(contentType: ContentType): string | null {
  switch (contentType) {
    case "video":
      return "Cole uma URL do YouTube, Vimeo, ou qualquer player de vídeo para exibição automática.";
    case "pdf":
      return "O PDF será exibido diretamente no player. Certifique-se que o link permite acesso público.";
    case "download":
      return "O aluno poderá baixar este arquivo diretamente.";
    case "live":
      return "O link será exibido para os alunos no momento da live.";
    default:
      return null;
  }
}

function getUrlIcon(contentType: ContentType) {
  switch (contentType) {
    case "video":
      return <Youtube className="h-4 w-4 text-muted-foreground" />;
    case "pdf":
      return <FileVideo className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Link2 className="h-4 w-4 text-muted-foreground" />;
  }
}

export function ContentMediaSection({
  contentType,
  contentUrl,
  onContentUrlChange,
}: ContentMediaSectionProps) {
  // Text and Quiz types don't need a URL section
  if (contentType === "text" || contentType === "quiz") {
    return null;
  }

  const tip = getUrlTip(contentType);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Conteúdo</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content-url">{getUrlLabel(contentType)}</Label>
        <div className="relative max-w-xl">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getUrlIcon(contentType)}
          </div>
          <Input
            id="content-url"
            value={contentUrl || ""}
            onChange={(e) => onContentUrlChange(e.target.value)}
            placeholder={getUrlPlaceholder(contentType)}
            className="pl-10"
          />
        </div>
      </div>

      {tip && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{tip}</span>
        </div>
      )}
    </div>
  );
}
