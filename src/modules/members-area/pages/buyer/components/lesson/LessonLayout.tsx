/**
 * LessonLayout - Main layout for lesson viewer
 * Left: Video/Content area | Right: Sidebar with modules
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LessonLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function LessonLayout({ children, sidebar, className }: LessonLayoutProps) {
  return (
    <div className={cn("flex flex-1 overflow-hidden", className)}>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Right Sidebar - Desktop Only */}
      {sidebar}
    </div>
  );
}
