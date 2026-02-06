/**
 * Builder Canvas - Área central de preview/edição com sidebar Netflix
 * Layout edge-to-edge como Kiwify
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SectionWrapper } from './SectionWrapper';
import { AddSectionButton } from './AddSectionButton';
import { SectionView } from '../sections/SectionView';
import { MenuPreview } from '../preview/MenuPreview';
import { MobileBottomNav } from '../preview/MobileBottomNav';
import { resolveGradientConfig, buildGradientContentStyle } from '../../utils/gradientUtils';
import type { BuilderState, BuilderActions, SectionType, FixedHeaderSettings } from '../../types';

interface BuilderCanvasProps {
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderCanvas({ state, actions }: BuilderCanvasProps) {
  const { sections, selectedSectionId, selectedMenuItemId, viewMode, isPreviewMode, isMenuCollapsed, settings, modules } = state;

  // Separate fixed_header from regular sections
  const fixedHeader = sections.find(s => s.type === 'fixed_header');
  const regularSections = sections.filter(s => s.type !== 'fixed_header');

  // Menu visibility flags (defaults to true for new products without explicit settings)
  const showMenuDesktop = settings.show_menu_desktop ?? true;
  const showMenuMobile = settings.show_menu_mobile ?? true;

  // Compute background override for custom gradient color continuity
  // Sets BOTH --background (for children) AND backgroundColor (overrides hardcoded Tailwind)
  const contentStyle = useMemo(() => {
    if (!fixedHeader) return undefined;
    const headerSettings = fixedHeader.settings as FixedHeaderSettings;
    const gradientConfig = resolveGradientConfig(headerSettings.gradient_overlay);
    return buildGradientContentStyle(gradientConfig);
  }, [fixedHeader]);

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= regularSections.length) return;
    
    const orderedIds = [...regularSections].map(s => s.id);
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];
    
    // Include fixed_header ID at the beginning if it exists
    const finalOrderedIds = fixedHeader ? [fixedHeader.id, ...orderedIds] : orderedIds;
    actions.reorderSections(finalOrderedIds);
  };

  const handleAddSection = (type: SectionType) => {
    actions.addSection(type);
  };

  const handleModuleClick = (moduleId: string) => {
    actions.selectModule(moduleId);
    actions.setEditingModule(true);
  };

  const isDesktop = viewMode === 'desktop';

  // Mobile view - centered with max-width
  if (!isDesktop) {
    return (
      <div 
        className={cn(
          'flex-1 overflow-auto p-4 transition-all duration-300',
          settings.theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
        )}
        onClick={() => actions.selectSection(null)}
      >
        <div 
          className={cn(
            'mx-auto transition-all duration-300 rounded-lg overflow-hidden shadow-2xl flex flex-col',
            'max-w-sm',
            settings.theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
          )}
          style={{ minHeight: '600px', ...contentStyle }}
        >
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              {!fixedHeader && regularSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <p className="text-lg mb-4">Nenhuma seção adicionada</p>
                  <AddSectionButton 
                    sections={sections} 
                    onAdd={handleAddSection}
                  />
                </div>
              ) : (
                <>
                  {/* Fixed Header - always first, no movement controls */}
                  {fixedHeader && (
                    <SectionWrapper
                      key={fixedHeader.id}
                      section={fixedHeader}
                      isSelected={selectedSectionId === fixedHeader.id}
                      isFirst={true}
                      isLast={regularSections.length === 0}
                      isPreviewMode={isPreviewMode}
                      onSelect={() => actions.selectSection(fixedHeader.id)}
                      onMoveUp={() => {}}
                      onMoveDown={() => {}}
                    >
                      <SectionView 
                        section={fixedHeader} 
                        viewMode={viewMode}
                        theme={settings.theme}
                        modules={modules}
                        isPreviewMode={isPreviewMode}
                      />
                    </SectionWrapper>
                  )}
                  
                  {/* Regular Sections */}
                  {regularSections.map((section, index) => (
                    <SectionWrapper
                      key={section.id}
                      section={section}
                      isSelected={selectedSectionId === section.id}
                      isFirst={index === 0}
                      isLast={index === regularSections.length - 1}
                      isPreviewMode={isPreviewMode}
                      onSelect={() => actions.selectSection(section.id)}
                      onMoveUp={() => handleMoveSection(index, 'up')}
                      onMoveDown={() => handleMoveSection(index, 'down')}
                    >
                    <SectionView 
                      section={section} 
                      viewMode={viewMode}
                      theme={settings.theme}
                      modules={section.type === 'modules' ? modules : undefined}
                      onModuleClick={section.type === 'modules' ? handleModuleClick : undefined}
                      isPreviewMode={isPreviewMode}
                    />
                    </SectionWrapper>
                  ))}
                  
                  {!isPreviewMode && (
                    <div className="flex justify-center py-4">
                      <AddSectionButton 
                        sections={sections} 
                        onAdd={handleAddSection}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {showMenuMobile && (
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

  // Desktop view - edge-to-edge layout
  return (
    <div 
      className={cn(
        'flex-1 flex overflow-hidden transition-all duration-300',
        settings.theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      )}
      style={contentStyle}
      onClick={() => actions.selectSection(null)}
    >
      {/* Desktop Sidebar - Full height */}
      {showMenuDesktop && (
        <MenuPreview
          settings={settings}
          isPreviewMode={isPreviewMode}
          isCollapsed={isMenuCollapsed}
          selectedMenuItemId={selectedMenuItemId}
          onToggleCollapse={actions.toggleMenuCollapse}
          onSelectMenuItem={actions.selectMenuItem}
        />
      )}

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {!fixedHeader && regularSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
              <p className={cn(
                'text-lg mb-4',
                settings.theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
              )}>
                Nenhuma seção adicionada
              </p>
              <AddSectionButton 
                sections={sections} 
                onAdd={handleAddSection}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Fixed Header - always first, no movement controls */}
              {fixedHeader && (
                <SectionWrapper
                  key={fixedHeader.id}
                  section={fixedHeader}
                  isSelected={selectedSectionId === fixedHeader.id}
                  isFirst={true}
                  isLast={regularSections.length === 0}
                  isPreviewMode={isPreviewMode}
                  onSelect={() => actions.selectSection(fixedHeader.id)}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                >
                  <SectionView 
                    section={fixedHeader} 
                    viewMode={viewMode}
                    theme={settings.theme}
                    modules={modules}
                    isPreviewMode={isPreviewMode}
                  />
                </SectionWrapper>
              )}
              
              {/* Regular Sections */}
              {regularSections.map((section, index) => (
                <SectionWrapper
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  isFirst={index === 0}
                  isLast={index === regularSections.length - 1}
                  isPreviewMode={isPreviewMode}
                  onSelect={() => actions.selectSection(section.id)}
                  onMoveUp={() => handleMoveSection(index, 'up')}
                  onMoveDown={() => handleMoveSection(index, 'down')}
                >
                      <SectionView 
                        section={section} 
                        viewMode={viewMode}
                        theme={settings.theme}
                        modules={section.type === 'modules' ? modules : undefined}
                        onModuleClick={section.type === 'modules' ? handleModuleClick : undefined}
                        isPreviewMode={isPreviewMode}
                      />
                </SectionWrapper>
              ))}
              
              {!isPreviewMode && (
                <div className="flex justify-center py-4">
                  <AddSectionButton 
                    sections={sections} 
                    onAdd={handleAddSection}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
