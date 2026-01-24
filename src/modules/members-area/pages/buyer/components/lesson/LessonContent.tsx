/**
 * LessonContent - Main content area with video, description, and attachments
 * Premium Cakto-parity layout with maximized video and clean hierarchy
 */

import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { Paperclip, FileText } from "lucide-react";
import { LessonInfoBar } from "./LessonInfoBar";
import { MinimalNavFooter } from "./MinimalNavFooter";
import { AttachmentsList } from "./AttachmentsList";
import type { ContentItem } from "../types";

interface LessonContentProps {
  content: ContentItem;
  contentId: string;
  moduleTitle?: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isCompleting?: boolean;
  isCompleted?: boolean;
}

export function LessonContent({
  content,
  contentId,
  moduleTitle,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onComplete,
  isCompleting = false,
  isCompleted = false,
}: LessonContentProps) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col min-h-full"
    >
      {/* Video Section - Maximized Cakto-style layout */}
      {hasVideo && (
        <div className="w-full bg-muted/30 px-4 lg:px-6 xl:px-8 py-4">
          <div className="aspect-video">
            <iframe
              src={content.content_url!}
              className="w-full h-full rounded-xl shadow-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      )}

      {/* Content Section - Cakto-parity layout */}
      <div className="flex-1 flex flex-col px-4 lg:px-6 xl:px-8 py-6">
        {/* Info Bar - Module + Title */}
        <LessonInfoBar
          moduleTitle={moduleTitle || ""}
          contentTitle={content.title}
        />

        {/* Description */}
        {content.description && (
          <p className="text-muted-foreground text-base leading-relaxed mt-4">
            {content.description}
          </p>
        )}

        {/* Body Content (HTML) - Premium Card Container */}
        {hasBody && (
          <div className="mt-8 rounded-xl border border-border bg-card/50 p-5">
            <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-sm text-foreground">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              Conteúdo da Aula
            </h3>
            <div
              className="prose prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:text-base prose-strong:text-foreground prose-a:text-primary prose-a:font-medium prose-a:underline-offset-2 hover:prose-a:underline prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-li:marker:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-hr:border-border"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  content.body || (content.content_data?.html as string) || ""
                ),
              }}
            />
          </div>
        )}

        {/* Attachments Section - Cakto-style card */}
        {hasAttachments && (
          <div className="mt-8 rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-sm text-foreground">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>
              Materiais ({attachmentCount})
            </h3>
            <AttachmentsList attachments={content.attachments!} />
          </div>
        )}

        {/* Spacer to push navigation to bottom */}
        <div className="flex-1 min-h-8" />

        {/* Navigation Footer - Cakto-style */}
        <MinimalNavFooter
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={onPrevious}
          onNext={onNext}
          onComplete={onComplete}
          isCompleting={isCompleting}
          isCompleted={isCompleted}
        />
      </div>
    </motion.div>
  );
}
