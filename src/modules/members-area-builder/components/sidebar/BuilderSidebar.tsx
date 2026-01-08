/**
 * Builder Sidebar - Painel lateral de configuração
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Layers, Palette } from 'lucide-react';
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
      <Tabs defaultValue="home" className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b h-12 px-2 shrink-0">
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            Início
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Layers className="h-4 w-4" />
            Seções
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Palette className="h-4 w-4" />
            Global
          </TabsTrigger>
        </TabsList>

        {/* Aba Início - Árvore de Navegação */}
        <TabsContent value="home" className="flex-1 flex flex-col m-0 overflow-hidden">
          <SectionTreePanel
            sections={sections}
            selectedSectionId={selectedSectionId}
            modules={modules}
            actions={actions}
          />
        </TabsContent>

        {/* Aba Seções - Editor da Seção Selecionada */}
        <TabsContent value="sections" className="flex-1 overflow-auto m-0 p-4">
          {selectedSection ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium">
                Nenhuma seção selecionada
              </p>
              <p className="text-sm text-muted-foreground/80 mt-1">
                Selecione uma seção na aba "Início" para editar
              </p>
            </div>
          )}
        </TabsContent>

        {/* Aba Global - Configurações Globais */}
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
