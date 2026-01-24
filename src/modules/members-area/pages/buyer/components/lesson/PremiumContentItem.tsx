/**
 * PremiumContentItem - Premium content/lesson item in the sidebar
 * RiseCheckout exclusive design
 * 
 * Features:
 * - Elegant status indicators
 * - Smooth hover animations
 * - Active state with gradient
 * - Completion checkmark animation
 */

import { motion } from "framer-motion";
import { Check, Play, FileText, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem as ContentItemType } from "../../types";

interface PremiumContentItemProps {
  content: ContentItemType;
  contentIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function PremiumContentItem({
  content,
  contentIndex,
  isActive,
  isCompleted,
  onClick,
}: PremiumContentItemProps) {
  // Get content type icon
  const getContentIcon = () => {
    switch (content.content_type) {
      case "video":
        return <Video className="h-3 w-3" />;
      case "text":
        return <FileText className="h-3 w-3" />;
      case "image":
        return <ImageIcon className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all duration-200 group",
        isActive
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
          : isCompleted
          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
          : "hover:bg-muted/50"
      )}
    >
      {/* Status Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
          isCompleted && !isActive
            ? "bg-emerald-500/20 text-emerald-500"
            : isActive
            ? "bg-white/20 text-white"
            : "bg-muted/50 text-muted-foreground group-hover:bg-violet-500/10 group-hover:text-violet-500"
        )}
      >
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.div>
        ) : isActive ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Play className="h-3 w-3 ml-0.5" fill="currentColor" />
          </motion.div>
        ) : (
          <span className="text-xs font-medium">{contentIndex + 1}</span>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "block truncate font-medium transition-colors",
            isActive
              ? "text-white"
              : isCompleted
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400"
          )}
        >
          {content.title}
        </span>
        {/* Duration placeholder - can be added when duration_seconds is available */}
      </div>

      {/* Content Type Badge */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors",
          isActive
            ? "bg-white/10 text-white/70"
            : "bg-muted/30 text-muted-foreground/50"
        )}
      >
        {getContentIcon()}
      </div>
    </motion.button>
  );
}
