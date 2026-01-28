/**
 * Builder Header - Toolbar superior do builder
 * 
 * Centraliza controles de viewport (Desktop/Mobile) e opções de sincronização.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Eye, 
  EyeOff,
  Save,
  Loader2,
  Copy,
  Link,
  Unlink,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BuilderState, BuilderActions } from '../../types/builder.types';

interface BuilderHeaderProps {
  productId: string;
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderHeader({ productId, state, actions }: BuilderHeaderProps) {
  const navigate = useNavigate();
  const { 
    viewMode, 
    isPreviewMode, 
    isDirty, 
    isSaving, 
    activeViewport,
    isMobileSynced,
    desktopSections,
    mobileSections,
  } = state;

  const handleBack = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate(`/dashboard/produtos/editar?id=${productId}&section=members-area&tab=content`);
    }
  };

  const handleSave = async () => {
    await actions.save();
  };

  const isDesktop = activeViewport === 'desktop';
  const isMobile = activeViewport === 'mobile';

  return (
    <TooltipProvider>
      <header className="h-14 border-b bg-background flex items-center justify-between px-4">
        {/* Left: Back Button + Title */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <h1 className="font-semibold text-sm">
            Personalizar Área de Membros
          </h1>
        </div>

        {/* Center: Viewport Toggle + Sync Options */}
        <div className="flex items-center gap-3">
          {/* Viewport Toggle (activeViewport) */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={isDesktop ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 gap-1.5',
                isDesktop && 'shadow-sm'
              )}
              onClick={() => actions.setActiveViewport('desktop')}
            >
              <Monitor className="h-4 w-4" />
              Desktop
              <span className="text-xs opacity-70">({desktopSections.length})</span>
            </Button>
            <Button
              variant={isMobile ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 gap-1.5',
                isMobile && 'shadow-sm'
              )}
              onClick={() => actions.setActiveViewport('mobile')}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
              <span className="text-xs opacity-70">({mobileSections.length})</span>
            </Button>
          </div>

          {/* Sync Options - Only when Mobile is active */}
          {isMobile && (
            <>
              <Separator orientation="vertical" className="h-6" />
              
              {/* Sync Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isMobileSynced ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 gap-1.5"
                      onClick={() => actions.setMobileSynced(!isMobileSynced)}
                    >
                      {isMobileSynced ? (
                        <Link className="h-4 w-4 text-primary" />
                      ) : (
                        <Unlink className="h-4 w-4 text-muted-foreground" />
                      )}
                      {isMobileSynced ? 'Sincronizado' : 'Independente'}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isMobileSynced 
                    ? 'Alterações no Desktop são espelhadas no Mobile' 
                    : 'Mobile tem layout independente do Desktop'
                  }
                </TooltipContent>
              </Tooltip>

              {/* Copy from Desktop - Only when NOT synced */}
              {!isMobileSynced && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 gap-1.5"
                      onClick={actions.copyDesktopToMobile}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Desktop
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Copiar todo o layout do Desktop para o Mobile
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Right: View Mode + Preview + Save */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle (for preview) */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3"
              onClick={() => actions.setViewMode('desktop')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3"
              onClick={() => actions.setViewMode('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="outline"
            size="sm"
            onClick={actions.togglePreviewMode}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Editar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
