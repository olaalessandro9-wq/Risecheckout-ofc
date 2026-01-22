/**
 * ContentCard - Card for individual content items within a module
 * Unified content type system (mixed, video, text)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  FileText,
  Layers,
  Video,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
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
import type { MemberContent, ContentDisplayType } from '@/modules/members-area/types';
import { formatDuration, normalizeContentType } from '@/modules/members-area/utils';

interface ContentCardProps {
  content: MemberContent;
  isLocked?: boolean;
  unlockDate?: string | null;
  progressPercent?: number;
  isCompleted?: boolean;
  isDragging?: boolean;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

const contentTypeConfig: Record<ContentDisplayType, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  mixed: { icon: Layers, label: 'Conteúdo', color: 'text-primary' },
  video: { icon: Video, label: 'Vídeo', color: 'text-red-500' },
  text: { icon: FileText, label: 'Texto', color: 'text-blue-500' },
};

export function ContentCard({
  content,
  isLocked = false,
  unlockDate,
  progressPercent = 0,
  isCompleted = false,
  isDragging = false,
  onPlay,
  onEdit,
  onDelete,
  onToggleActive,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const normalizedType = normalizeContentType(content.content_type);
  const config = contentTypeConfig[normalizedType];
  const Icon = config.icon;

  const formattedUnlockDate = unlockDate 
    ? new Date(unlockDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  // Check if content has video
  const hasVideo = content.content_url || normalizedType === 'video';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'group relative flex items-center gap-4 p-3 rounded-lg border bg-card/50 transition-all duration-200',
        'hover:bg-accent/50 hover:border-accent',
        isDragging && 'shadow-lg ring-2 ring-primary/30 bg-card',
        isLocked && 'opacity-60',
        !content.is_active && 'opacity-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content Type Icon / Play Button */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200',
            isCompleted 
              ? 'bg-primary/10' 
              : isLocked 
                ? 'bg-muted' 
                : 'bg-muted group-hover:bg-primary/10'
          )}
        >
          {isLocked ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Icon className={cn('w-5 h-5', config.color)} />
          )}
        </div>

        {/* Play overlay on hover (for video content) */}
        {hasVideo && !isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              scale: isHovered ? 1 : 0.8 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Button
              size="icon"
              variant="default"
              className="w-10 h-10 rounded-full shadow-lg"
              onClick={onPlay}
            >
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            </Button>
          </motion.div>
        )}

        {/* Progress ring for video */}
        {hasVideo && progressPercent > 0 && !isCompleted && (
          <svg className="absolute inset-0 w-12 h-12 -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/20"
            />
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progressPercent * 1.38} 138`}
              className="text-primary"
            />
          </svg>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            'font-medium text-sm line-clamp-1',
            isLocked && 'text-muted-foreground'
          )}>
            {content.title}
          </h4>
          
          {!content.is_active && (
            <Badge variant="secondary" className="text-xs py-0">
              <EyeOff className="w-3 h-3 mr-1" />
              Oculto
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs py-0 px-1.5">
            {config.label}
          </Badge>

          {content.duration_seconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(content.duration_seconds)}
            </span>
          )}

          {isLocked && formattedUnlockDate && (
            <span className="flex items-center gap-1 text-amber-500">
              <Lock className="w-3 h-3" />
              Libera em {formattedUnlockDate}
            </span>
          )}

          {isCompleted && (
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="w-3 h-3" />
              Concluído
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isLocked && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onPlay}
          >
            {hasVideo ? 'Assistir' : 'Abrir'}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar conteúdo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {content.is_active ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
