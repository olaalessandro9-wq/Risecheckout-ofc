/**
 * Courses View - Renderiza seção de cursos
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';
import type { Section, CoursesSettings, ViewMode } from '../../../types/builder.types';

interface CoursesViewProps {
  section: Section;
  viewMode: ViewMode;
  theme: 'light' | 'dark';
}

// Mock data para preview
const MOCK_COURSES = [
  { id: '1', title: 'Curso Completo de Marketing', thumbnail: null, modules: 12 },
  { id: '2', title: 'Vendas Online', thumbnail: null, modules: 8 },
  { id: '3', title: 'Copywriting Avançado', thumbnail: null, modules: 6 },
];

export function CoursesView({ section, viewMode, theme }: CoursesViewProps) {
  const settings = section.settings as CoursesSettings;
  const cardsPerRow = viewMode === 'mobile' ? 1 : (settings.cards_per_row || 4);
  
  return (
    <div className="p-6">
      {/* Section Title */}
      {section.title && (
        <h2 className={cn(
          'text-xl font-bold mb-4',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {section.title}
        </h2>
      )}

      {settings.layout === 'carousel' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {MOCK_COURSES.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              theme={theme}
              className="flex-shrink-0 w-64"
            />
          ))}
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` 
          }}
        >
          {MOCK_COURSES.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseCardProps {
  course: typeof MOCK_COURSES[0];
  theme: 'light' | 'dark';
  className?: string;
}

function CourseCard({ course, theme, className }: CourseCardProps) {
  return (
    <div className={cn('group cursor-pointer', className)}>
      {/* Thumbnail */}
      <div 
        className={cn(
          'relative aspect-video rounded-lg overflow-hidden',
          theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200'
        )}
      >
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className={cn(
          'font-medium line-clamp-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {course.modules} módulos
        </p>
      </div>
    </div>
  );
}
