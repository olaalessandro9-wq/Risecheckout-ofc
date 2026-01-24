/**
 * LessonInfoBar - Module and content title display (Cakto-style)
 * Shows module label (small) + content title (large/bold)
 */

import { cn } from "@/lib/utils";

interface LessonInfoBarProps {
  moduleTitle: string;
  contentTitle: string;
  moduleIndex?: number;
  className?: string;
}

export function LessonInfoBar({
  moduleTitle,
  contentTitle,
  moduleIndex,
  className,
}: LessonInfoBarProps) {
  // Format module label like "#1 Bônus" or just the title
  const moduleLabel = moduleIndex !== undefined 
    ? `#${moduleIndex + 1} ${moduleTitle}`
    : moduleTitle;

  return (
    <div className={cn("space-y-1", className)}>
      {/* Module Label - Small, muted */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {moduleLabel}
      </p>
      
      {/* Content Title - Large, bold */}
      <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
        {contentTitle}
      </h1>
    </div>
  );
}
