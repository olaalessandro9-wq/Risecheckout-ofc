/**
 * LessonContent - Main content area with video, description, and attachments
 * Cakto/Kiwify style layout
 */

import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { Paperclip } from "lucide-react";
import { LessonRating } from "./LessonRating";
import { LessonNavigation } from "./LessonNavigation";
import { AttachmentsList } from "./AttachmentsList";
import type { ContentItem } from "../types";

interface LessonContentProps {
  content: ContentItem;
  contentId: string;
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
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-4 md:p-6 space-y-6"
    >
      {/* Video Player */}
      {hasVideo && (
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={content.content_url!}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Title and Info Section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {content.title}
            </h1>
            {content.description && (
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                {content.description}
              </p>
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
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium flex items-center gap-2 mb-4 text-foreground">
            <Paperclip className="h-4 w-4 text-primary" />
            Materiais ({attachmentCount})
          </h3>
          <AttachmentsList attachments={content.attachments!} />
        </div>
      )}

      {/* Navigation Footer */}
      <LessonNavigation
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={onPrevious}
        onNext={onNext}
        onComplete={onComplete}
        isCompleting={isCompleting}
        isCompleted={isCompleted}
      />
    </motion.div>
  );
}
