/**
 * Module Sidebar Component
 * Desktop sidebar with module/content navigation
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Module, ContentItem } from "./types";
import { contentTypeIcons, contentTypeLabels } from "./types";

interface ModuleSidebarProps {
  modules: Module[];
  selectedContent: ContentItem | null;
  onSelectContent: (content: ContentItem) => void;
}

export function ModuleSidebar({ modules, selectedContent, onSelectContent }: ModuleSidebarProps) {
  return (
    <aside className="w-80 border-r border-border/50 bg-card/30 overflow-y-auto hidden lg:block">
      <div className="p-4">
        <Accordion type="multiple" defaultValue={modules.map((m) => m.id)}>
          {modules.map((module) => (
            <AccordionItem key={module.id} value={module.id}>
              <AccordionTrigger className="text-sm font-medium">
                {module.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {module.contents.map((content) => (
                    <button
                      key={content.id}
                      onClick={() => onSelectContent(content)}
                      className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors ${
                        selectedContent?.id === content.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {contentTypeIcons[content.content_type] || contentTypeIcons.mixed}
                      <span className="truncate flex-1">{content.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {contentTypeLabels[content.content_type] || "Conteúdo"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </aside>
  );
}
