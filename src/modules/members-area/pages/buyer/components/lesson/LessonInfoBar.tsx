/**
 * LessonInfoBar - Module and content title display (Cakto-style)
 * Shows module label (small) + content title (large/bold)
 */

import { cn } from "@/lib/utils";

interface LessonInfoBarProps {
  moduleTitle: string;
  contentTitle: string;
  className?: string;
}

export function LessonInfoBar({
  moduleTitle,
  contentTitle,
  className,
}: LessonInfoBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Module Label - Small, muted, Cakto-style */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {moduleTitle}
      </p>
      
      {/* Content Title - Large, bold, Cakto-style */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
        {contentTitle}
      </h1>
    </div>
  );
}
