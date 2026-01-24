/**
 * PremiumContentItem - Elegant content item for premium sidebar
 * Clean design with check/play icons, no numbered circles
 */

import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem } from "../types";

interface PremiumContentItemProps {
  content: ContentItem;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function PremiumContentItem({
  content,
  isActive,
  isCompleted,
  onClick,
}: PremiumContentItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left text-sm transition-all duration-150",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-muted/70"
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors",
          isCompleted
            ? "bg-emerald-500 text-white"
            : isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : isActive ? (
          <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
        )}
      </div>

      {/* Content Title */}
      <span
        className={cn(
          "flex-1 truncate",
          isActive
            ? "font-medium"
            : isCompleted
            ? "text-muted-foreground"
            : "text-foreground"
        )}
      >
        {content.title}
      </span>
    </button>
  );
}
