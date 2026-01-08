/**
 * Section View - Renderiza a seção correta baseado no tipo
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import type { Section, ViewMode, MemberModule } from '../../types/builder.types';
import { BannerView } from './Banner/BannerView';
import { ModulesView } from './Modules/ModulesView';
import { CoursesView } from './Courses/CoursesView';
import { ContinueWatchingView } from './ContinueWatching/ContinueWatchingView';
import { TextView } from './Text/TextView';
import { SpacerView } from './Spacer/SpacerView';

interface SectionViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
  modules?: MemberModule[];
  onModuleClick?: (moduleId: string) => void;
  isPreviewMode?: boolean;
}

export function SectionView({ 
  section, 
  viewMode, 
  theme, 
  modules, 
  onModuleClick,
  isPreviewMode = false
}: SectionViewProps) {
  const commonProps = { viewMode, theme, isPreviewMode };

  switch (section.type) {
    case 'banner':
      return <BannerView section={section} {...commonProps} />;
    case 'modules':
      return <ModulesView section={section} {...commonProps} modules={modules} onModuleClick={onModuleClick} />;
    case 'courses':
      return <CoursesView section={section} {...commonProps} />;
    case 'continue_watching':
      return <ContinueWatchingView section={section} {...commonProps} />;
    case 'text':
      return <TextView section={section} {...commonProps} />;
    case 'spacer':
      return <SpacerView section={section} {...commonProps} />;
    default:
      return (
        <div className="p-8 text-center text-muted-foreground">
          Tipo de seção desconhecido: {section.type}
        </div>
      );
  }
}
