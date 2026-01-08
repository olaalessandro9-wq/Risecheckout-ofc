/**
 * Builder Canvas - Área central de preview/edição com sidebar Netflix
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { SectionWrapper } from './SectionWrapper';
import { AddSectionButton } from './AddSectionButton';
import { SectionView } from '../sections/SectionView';
import { MenuPreview } from '../preview/MenuPreview';
import { MobileBottomNav } from '../preview/MobileBottomNav';
import type { BuilderState, BuilderActions, SectionType } from '../../types/builder.types';

interface BuilderCanvasProps {
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderCanvas({ state, actions }: BuilderCanvasProps) {
  const { sections, selectedSectionId, selectedMenuItemId, viewMode, isPreviewMode, isMenuCollapsed, settings } = state;

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const orderedIds = [...sections].map(s => s.id);
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];
    actions.reorderSections(orderedIds);
  };

  const handleAddSection = (type: SectionType) => {
    actions.addSection(type);
  };

  const isDesktop = viewMode === 'desktop';

  return (
    <div 
      className={cn(
        'flex-1 overflow-auto p-6 transition-all duration-300',
        settings.theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'
      )}
      onClick={() => actions.selectSection(null)}
    >
      {/* Canvas Frame */}
      <div 
        className={cn(
          'mx-auto transition-all duration-300 rounded-lg overflow-hidden shadow-2xl flex',
          isDesktop ? 'max-w-5xl flex-row' : 'max-w-sm flex-col',
          settings.theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
        )}
        style={{ minHeight: '600px' }}
      >
        {/* Desktop Sidebar */}
        {isDesktop && (
          <MenuPreview
            settings={settings}
            isPreviewMode={isPreviewMode}
            isCollapsed={isMenuCollapsed}
            selectedMenuItemId={selectedMenuItemId}
            onToggleCollapse={actions.toggleMenuCollapse}
            onSelectMenuItem={actions.selectMenuItem}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sections */}
          <div className="flex-1 flex flex-col overflow-auto">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg mb-4">Nenhuma seção adicionada</p>
                <AddSectionButton 
                  sections={sections} 
                  onAdd={handleAddSection}
                />
              </div>
            ) : (
              <>
                {sections.map((section, index) => (
                  <SectionWrapper
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    isFirst={index === 0}
                    isLast={index === sections.length - 1}
                    isPreviewMode={isPreviewMode}
                    onSelect={() => actions.selectSection(section.id)}
                    onMoveUp={() => handleMoveSection(index, 'up')}
                    onMoveDown={() => handleMoveSection(index, 'down')}
                    onDuplicate={() => actions.duplicateSection(section.id)}
                    onDelete={() => actions.deleteSection(section.id)}
                    onToggleActive={() => actions.updateSection(section.id, { is_active: !section.is_active })}
                  >
                    <SectionView 
                      section={section} 
                      viewMode={viewMode}
                      theme={settings.theme}
                    />
                  </SectionWrapper>
                ))}
                
                {/* Add Section Button */}
                {!isPreviewMode && (
                  <div className="flex justify-center py-8">
                    <AddSectionButton 
                      sections={sections} 
                      onAdd={handleAddSection}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Bottom Nav */}
          {!isDesktop && (
            <MobileBottomNav
              settings={settings}
              isPreviewMode={isPreviewMode}
              selectedMenuItemId={selectedMenuItemId}
              onSelectMenuItem={actions.selectMenuItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
