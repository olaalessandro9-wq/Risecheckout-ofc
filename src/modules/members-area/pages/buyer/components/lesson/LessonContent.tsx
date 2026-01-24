/**
 * LessonContent - Main content area with video, description, and attachments
 * Premium Cakto-style layout with larger video and clean hierarchy
 */

import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { Paperclip } from "lucide-react";
import { LessonInfoBar } from "./LessonInfoBar";
import { MinimalNavFooter } from "./MinimalNavFooter";
import { AttachmentsList } from "./AttachmentsList";
import type { ContentItem } from "../types";

interface LessonContentProps {
  content: ContentItem;
  contentId: string;
  moduleTitle?: string;
  moduleIndex?: number;
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
  moduleIndex,
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
      {/* Video Section - Centered, Cakto-style layout */}
      {hasVideo && (
        <div className="w-full flex justify-center bg-muted/30">
          <div className="w-full max-w-5xl">
            <div className="aspect-video">
              <iframe
                src={content.content_url!}
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Info Bar - Module + Title (Cakto-style) */}
        <LessonInfoBar
          moduleTitle={moduleTitle || ""}
          contentTitle={content.title}
          moduleIndex={moduleIndex}
        />

        {/* Description */}
        {content.description && (
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {content.description}
          </p>
        )}

        {/* Body Content (HTML) */}
        {hasBody && (
          <div
            className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                content.body || (content.content_data?.html as string) || ""
              ),
            }}
          />
        )}

        {/* Attachments Section */}
        {hasAttachments && (
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <h3 className="font-medium flex items-center gap-2 mb-4 text-sm text-foreground">
              <Paperclip className="h-4 w-4 text-primary" />
              Materiais ({attachmentCount})
            </h3>
            <AttachmentsList attachments={content.attachments!} />
          </div>
        )}

        {/* Navigation Footer - Minimalist */}
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
