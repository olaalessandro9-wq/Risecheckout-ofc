/**
 * PremiumLessonContent - Premium content area with video, description, and attachments
 * RiseCheckout exclusive design
 * 
 * Features:
 * - Premium video player container
 * - Elegant typography
 * - Beautiful attachments section
 * - Smooth animations
 */

import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { 
  Paperclip, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonRating } from "./LessonRating";
import { AttachmentsList } from "./AttachmentsList";
import type { ContentItem } from "../../types";
import { cn } from "@/lib/utils";

interface PremiumLessonContentProps {
  content: ContentItem;
  contentId: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export function PremiumLessonContent({
  content,
  contentId,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onComplete,
  isCompleted = false,
}: PremiumLessonContentProps) {
  const hasVideo = content.content_url && (
    content.content_type === "video" || 
    content.content_type === "mixed"
  );

  const hasBody = content.body || (content.content_data?.html as string);
  const hasAttachments = content.attachments && content.attachments.length > 0;
  const attachmentCount = content.attachments?.length || 0;

  return (
    <motion.div
      key={contentId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="max-w-5xl mx-auto p-4 md:p-8 space-y-8"
    >
      {/* Video Player with Premium Container */}
      {hasVideo && (
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Video container */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <iframe
              src={content.content_url!}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      )}

      {/* Title and Info Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
            >
              {content.title}
            </motion.h1>
            {content.description && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground mt-3 text-base md:text-lg leading-relaxed"
              >
                {content.description}
              </motion.p>
            )}
          </div>

          {/* Rating - Mobile */}
          <div className="lg:hidden flex-shrink-0">
            <LessonRating size="sm" />
          </div>
        </div>
      </div>

      {/* Body Content (HTML) */}
      {hasBody && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg dark:prose-invert max-w-none 
            prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-strong:text-foreground 
            prose-a:text-violet-500 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-violet-500 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
            prose-pre:bg-muted prose-pre:rounded-xl"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              content.body || (content.content_data?.html as string) || ""
            ),
          }}
        />
      )}

      {/* Attachments Section */}
      {hasAttachments && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-5 text-foreground">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Paperclip className="h-4 w-4 text-violet-500" />
            </div>
            <span>Materiais de Apoio</span>
            <span className="text-xs text-muted-foreground font-normal ml-1">
              ({attachmentCount} {attachmentCount === 1 ? 'arquivo' : 'arquivos'})
            </span>
          </h3>
          <AttachmentsList attachments={content.attachments!} />
        </motion.div>
      )}

      {/* Navigation Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50"
      >
        {/* Mark as Complete Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={isCompleted ? "secondary" : "outline"}
            onClick={onComplete}
            className={cn(
              "gap-2 rounded-xl h-11 px-5 transition-all duration-200",
              isCompleted 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" 
                : "hover:border-violet-500/50 hover:text-violet-500"
            )}
          >
            <CheckCircle2 className={cn(
              "h-4 w-4",
              isCompleted && "fill-emerald-500"
            )} />
            {isCompleted ? "Aula Concluída" : "Marcar como concluída"}
          </Button>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.02, x: -2 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="gap-2 rounded-xl h-11 px-5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onNext}
              disabled={!hasNext}
              className={cn(
                "gap-2 rounded-xl h-11 px-5 disabled:opacity-30",
                "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600",
                "text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
              )}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
