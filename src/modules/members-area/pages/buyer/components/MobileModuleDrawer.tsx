/**
 * Mobile Module Drawer Component
 * Bottom drawer for mobile module/content navigation
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Module, ContentItem } from "./types";
import { contentTypeIcons } from "./types";

interface MobileModuleDrawerProps {
  modules: Module[];
  selectedContent: ContentItem | null;
  onSelectContent: (content: ContentItem) => void;
}

export function MobileModuleDrawer({ modules, selectedContent, onSelectContent }: MobileModuleDrawerProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="modules">
          <AccordionTrigger className="text-sm font-medium">
            Módulos e Conteúdos
          </AccordionTrigger>
          <AccordionContent className="max-h-60 overflow-y-auto">
            {modules.map((module) => (
              <div key={module.id} className="mb-4">
                <p className="font-medium text-sm mb-2">{module.title}</p>
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
                      <span className="truncate">{content.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
