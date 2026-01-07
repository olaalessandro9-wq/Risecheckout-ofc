/**
 * Builder Sidebar - Painel lateral de configuração
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette } from 'lucide-react';
import { SectionEditor } from './SectionEditor';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
import type { BuilderState, BuilderActions } from '../../types/builder.types';

interface BuilderSidebarProps {
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderSidebar({ state, actions }: BuilderSidebarProps) {
  const { selectedSectionId, sections, settings } = state;
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <aside className="w-80 border-l bg-background flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="section" className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b h-12 px-2">
          <TabsTrigger value="section" className="gap-2">
            <Settings className="h-4 w-4" />
            Seção
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Palette className="h-4 w-4" />
            Global
          </TabsTrigger>
        </TabsList>

        <TabsContent value="section" className="flex-1 overflow-auto m-0 p-4">
          {selectedSection ? (
            <SectionEditor
              section={selectedSection}
              onUpdate={(updates) => actions.updateSection(selectedSection.id, updates)}
              onUpdateSettings={(settings) => actions.updateSectionSettings(selectedSection.id, settings)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Settings className="h-8 w-8 mb-2" />
              <p className="text-sm">
                Selecione uma seção para editar
              </p>
            </div>
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
