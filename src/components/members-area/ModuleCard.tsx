/**
 * ModuleCard - Netflix-style card for course modules
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  GripVertical,
  Image as ImageIcon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MemberModule } from '@/modules/members-area/types';

interface ModuleCardProps {
  module: MemberModule;
  contentsCount: number;
  completedCount?: number;
  isExpanded?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleExpand?: () => void;
  onToggleActive?: () => void;
  children?: React.ReactNode;
}

export function ModuleCard({
  module,
  contentsCount,
  completedCount = 0,
  isExpanded = false,
  isDragging = false,
  onEdit,
  onDelete,
  onToggleExpand,
  onToggleActive,
  children,
}: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercent = contentsCount > 0 
    ? Math.round((completedCount / contentsCount) * 100) 
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group relative rounded-xl border bg-card overflow-hidden transition-all duration-300',
        isDragging && 'shadow-2xl ring-2 ring-primary/50 scale-[1.02]',
        !module.is_active && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Cover Image */}
      <div className="relative">
        {/* Cover Image or Placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden">
          {module.cover_image_url ? (
            <img
              src={module.cover_image_url}
              alt={module.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

          {/* Drag Handle */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <div className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Status Badge */}
          {!module.is_active && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Oculto
            </Badge>
          )}

          {/* Play Button on Hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              scale: isHovered ? 1 : 0.8 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Button
              size="lg"
              className="rounded-full w-14 h-14 shadow-xl bg-primary hover:bg-primary/90"
              onClick={onToggleExpand}
            >
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            </Button>
          </motion.div>
        </div>

        {/* Module Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                {module.title}
              </h3>
              {module.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {module.description}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar módulo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  {module.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Ocultar módulo
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Mostrar módulo
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir módulo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {contentsCount} {contentsCount === 1 ? 'conteúdo' : 'conteúdos'}
            </span>
            {completedCount > 0 && (
              <span className="text-primary font-medium">
                {progressPercent}% concluído
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expandir
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        {completedCount > 0 && (
          <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0 space-y-2">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
