/**
 * Content Viewer Component
 * Renders different content types (mixed, video, text, pdf, link, download)
 */

import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Link as LinkIcon, ChevronRight, Paperclip } from "lucide-react";
import type { ContentItem } from "./types";

interface ContentViewerProps {
  content: ContentItem | null;
}

export function ContentViewer({ content }: ContentViewerProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Selecione um conteúdo para visualizar</p>
      </div>
    );
  }

  const contentType = content.content_type;

  // Mixed content (Kiwify-style): video + body + attachments
  if (contentType === "mixed") {
    return (
      <div className="space-y-6">
        {content.content_url && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={content.content_url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold">{content.title}</h3>
          {content.description && (
            <p className="text-muted-foreground mt-2">{content.description}</p>
          )}
        </div>

        {content.body && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content.body),
            }}
          />
        )}

        {content.content_data?.attachments && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Paperclip className="h-4 w-4" />
              Materiais
            </h4>
            <p className="text-sm text-muted-foreground">
              Anexos disponíveis para download
            </p>
          </div>
        )}
      </div>
    );
  }

  // Video only
  if (contentType === "video") {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {content.content_url ? (
            <iframe
              src={content.content_url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Vídeo não disponível</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{content.title}</h3>
          {content.description && (
            <p className="text-muted-foreground mt-2">{content.description}</p>
          )}
        </div>
      </div>
    );
  }

  // Text/HTML
  if (contentType === "text") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                content.body || 
                (content.content_data?.html as string) || 
                content.description || 
                ""
              ),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  // PDF
  if (contentType === "pdf") {
    return (
      <div className="space-y-4">
        {content.content_url && (
          <iframe
            src={content.content_url}
            className="w-full h-[70vh] rounded-lg border"
          />
        )}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-muted-foreground mt-1">{content.description}</p>
            )}
          </div>
          {content.content_url && (
            <a href={content.content_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Link
  if (contentType === "link") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          {content.description && (
            <CardDescription>{content.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {content.content_url && (
            <a
              href={content.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              Acessar Link
              <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  // Download
  if (contentType === "download") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          {content.description && (
            <CardDescription>{content.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {content.content_url && (
            <a href={content.content_url} download>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Baixar Arquivo
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
