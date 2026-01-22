/**
 * Builder Sidebar - Painel lateral de configuração
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Palette, Menu } from 'lucide-react';
import { SectionTreePanel } from './SectionTreePanel';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
import { MenuSettingsPanel } from './MenuSettingsPanel';
import type { BuilderState, BuilderActions } from '../../types/builder.types';

interface BuilderSidebarProps {
  state: BuilderState;
  actions: BuilderActions;
  productId?: string;
}

export function BuilderSidebar({ state, actions, productId }: BuilderSidebarProps) {
  const { selectedSectionId, sections, settings, modules } = state;

  const handleModuleEdit = (moduleId: string) => {
    actions.selectModule(moduleId);
    actions.setEditingModule(true);
  };

  return (
    <aside className="w-80 border-l bg-background flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="home" className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b h-12 px-2 shrink-0 bg-transparent p-0">
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            Início
          </TabsTrigger>
          <TabsTrigger value="menu" className="gap-2">
            <Menu className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="global" className="gap-2">
            <Palette className="h-4 w-4" />
            Global
          </TabsTrigger>
        </TabsList>

        {/* Aba Início - Árvore de Navegação com Editor Inline */}
        <TabsContent value="home" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden">
          <SectionTreePanel
            sections={sections}
            selectedSectionId={selectedSectionId}
            modules={modules}
            actions={actions}
            productId={productId}
            onModuleEdit={handleModuleEdit}
          />
        </TabsContent>

        {/* Aba Menu - Configurações do Menu/Sidebar */}
        <TabsContent value="menu" className="flex-1 overflow-auto mt-0 p-4 data-[state=inactive]:hidden">
          <MenuSettingsPanel
            settings={settings}
            onUpdate={actions.updateSettings}
          />
        </TabsContent>

        {/* Aba Global - Configurações Globais */}
        <TabsContent value="global" className="flex-1 overflow-auto mt-0 p-4 data-[state=inactive]:hidden">
          <GlobalSettingsPanel
            settings={settings}
            onUpdate={actions.updateSettings}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
