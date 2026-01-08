/**
 * Builder Sidebar - Painel lateral de configuração
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Layers, Palette } from 'lucide-react';
import { SectionEditor } from './SectionEditor';
import { SectionTreePanel } from './SectionTreePanel';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
import type { BuilderState, BuilderActions } from '../../types/builder.types';

interface BuilderSidebarProps {
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderSidebar({ state, actions }: BuilderSidebarProps) {
  const { selectedSectionId, sections, settings, modules } = state;
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const handleModuleEdit = (moduleId: string) => {
    actions.selectModule(moduleId);
    actions.setEditingModule(true);
  };

  return (
    <aside className="w-80 border-l bg-background flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="sections" className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b h-12 px-2 shrink-0">
          <TabsTrigger value="sections" className="gap-2">
            <Layers className="h-4 w-4" />
            Seções
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Palette className="h-4 w-4" />
            Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="flex-1 flex flex-col m-0 overflow-hidden">
          {/* Section Tree - upper part */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <SectionTreePanel
              sections={sections}
              selectedSectionId={selectedSectionId}
              modules={modules}
              actions={actions}
            />
          </div>
          
          {/* Section Editor - lower part (when section selected) */}
          {selectedSection && (
            <>
              <Separator />
              <div className="shrink-0 max-h-[50%] overflow-auto p-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Configurações
                </h3>
                <SectionEditor
                  section={selectedSection}
                  onUpdate={(updates) => actions.updateSection(selectedSection.id, updates)}
                  onUpdateSettings={(settings) => actions.updateSectionSettings(selectedSection.id, settings)}
                  modules={selectedSection.type === 'modules' ? modules : undefined}
                  onModuleEdit={selectedSection.type === 'modules' ? handleModuleEdit : undefined}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="global" className="flex-1 overflow-auto m-0 p-4">
          <GlobalSettingsPanel
            settings={settings}
            onUpdate={actions.updateSettings}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
