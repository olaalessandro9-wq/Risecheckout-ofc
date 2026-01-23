/**
 * ContentItem - Single content/lesson item in the sidebar list
 * Cakto-style with status indicators
 */

import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem as ContentItemType } from "../types";

interface ContentItemProps {
  content: ContentItemType;
  contentIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function ContentItem({
  content,
  contentIndex,
  isActive,
  isCompleted,
  onClick,
}: ContentItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 my-0.5 rounded-lg text-left text-sm transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-muted"
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
          isCompleted
            ? "bg-green-500 text-white"
            : isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="h-3 w-3" />
        ) : isActive ? (
          <Play className="h-3 w-3 fill-current" />
        ) : (
          <span className="text-xs font-medium">{contentIndex + 1}</span>
        )}
      </div>

      {/* Content Title */}
      <span
        className={cn(
          "flex-1 truncate",
          isActive
            ? "text-primary-foreground font-medium"
            : isCompleted
            ? "text-muted-foreground line-through decoration-muted-foreground/50"
            : "text-foreground"
        )}
      >
        {content.title}
      </span>
    </button>
  );
}
