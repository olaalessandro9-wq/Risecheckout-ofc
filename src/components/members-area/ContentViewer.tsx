/**
 * ContentViewer - Universal content viewer that routes to appropriate player
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MemberContent, ContentType } from '@/modules/members-area/types';
import { VideoPlayer } from './VideoPlayer';

interface ContentViewerProps {
  content: MemberContent;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  onProgressUpdate?: (position: number, duration: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  initialPosition?: number;
  className?: string;
}

export function ContentViewer({
  content,
  isOpen,
  onClose,
  onComplete,
  onProgressUpdate,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  initialPosition = 0,
  className,
}: ContentViewerProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete?.();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg">{content.title}</h2>
            {content.description && (
              <p className="text-sm text-muted-foreground">{content.description}</p>
            )}
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Concluído</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="h-full pt-20 pb-20 px-4 flex items-center justify-center">
        <ContentRenderer
          content={content}
          initialPosition={initialPosition}
          onProgress={onProgressUpdate}
          onComplete={handleComplete}
        />
      </div>

      {/* Navigation Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-background to-transparent">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={onClose} variant="secondary">
          Fechar
        </Button>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={!hasNext}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * ContentRenderer - Renders content based on type
 */
interface ContentRendererProps {
  content: MemberContent;
  initialPosition?: number;
  onProgress?: (position: number, duration: number) => void;
  onComplete?: () => void;
}

function ContentRenderer({
  content,
  initialPosition = 0,
  onProgress,
  onComplete,
}: ContentRendererProps) {
  switch (content.content_type as ContentType) {
    case 'video':
      return content.content_url ? (
        <div className="w-full max-w-5xl">
          <VideoPlayer
            url={content.content_url}
            title={content.title}
            initialPosition={initialPosition}
            onProgress={onProgress}
            onComplete={onComplete}
          />
        </div>
      ) : (
        <EmptyContent message="URL do vídeo não configurada" />
      );

    case 'pdf':
      return content.content_url ? (
        <div className="w-full max-w-4xl h-[80vh]">
          <iframe
            src={content.content_url}
            className="w-full h-full rounded-lg border"
            title={content.title}
          />
          <div className="mt-4 flex justify-center">
            <Button variant="outline" asChild>
              <a href={content.content_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <EmptyContent message="URL do PDF não configurada" />
      );

    case 'text':
      return (
        <ScrollArea className="w-full max-w-3xl h-[80vh]">
          <div className="prose prose-neutral dark:prose-invert max-w-none p-6">
            {content.body ? (
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            ) : (
              <EmptyContent message="Conteúdo não disponível" />
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={onComplete}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar como concluído
            </Button>
          </div>
        </ScrollArea>
      );

    case 'download':
      return content.content_url ? (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{content.title}</h3>
            {content.description && (
              <p className="text-muted-foreground mt-2">{content.description}</p>
            )}
          </div>
          <Button size="lg" asChild>
            <a href={content.content_url} download>
              <Download className="w-5 h-5 mr-2" />
              Baixar arquivo
            </a>
          </Button>
        </div>
      ) : (
        <EmptyContent message="URL do arquivo não configurada" />
      );

    case 'quiz':
      return (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Quiz será carregado aqui
          </p>
        </div>
      );

    case 'live':
      return (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Transmissão ao vivo será exibida aqui
          </p>
        </div>
      );

    default:
      return <EmptyContent message="Tipo de conteúdo não suportado" />;
  }
}

function EmptyContent({ message }: { message: string }) {
  return (
    <div className="text-center text-muted-foreground">
      <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p>{message}</p>
    </div>
  );
}
