/**
 * ViewportSyncPanel - Mobile Sync/Copy Controls
 * 
 * Displays sync options when editing Mobile viewport:
 * - Toggle sync with Desktop (auto-mirror)
 * - Copy from Desktop (one-time clone)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Link, Unlink, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Viewport } from '../../types/builder.types';

interface ViewportSyncPanelProps {
  activeViewport: Viewport;
  isMobileSynced: boolean;
  desktopSectionsCount: number;
  mobileSectionsCount: number;
  onSetActiveViewport: (viewport: Viewport) => void;
  onCopyDesktopToMobile: () => void;
  onSetMobileSynced: (synced: boolean) => void;
}

export function ViewportSyncPanel({
  activeViewport,
  isMobileSynced,
  desktopSectionsCount,
  mobileSectionsCount,
  onSetActiveViewport,
  onCopyDesktopToMobile,
  onSetMobileSynced,
}: ViewportSyncPanelProps) {
  const isDesktop = activeViewport === 'desktop';
  const isMobile = activeViewport === 'mobile';

  return (
    <div className="p-4 border-b bg-muted/30 space-y-4">
      {/* Viewport Toggle */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Editando Layout
        </Label>
        <div className="flex gap-2">
          <Button
            variant={isDesktop ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 gap-2',
              isDesktop && 'shadow-sm'
            )}
            onClick={() => onSetActiveViewport('desktop')}
          >
            <Monitor className="h-4 w-4" />
            Desktop
            <span className="text-xs opacity-70">({desktopSectionsCount})</span>
          </Button>
          <Button
            variant={isMobile ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1 gap-2',
              isMobile && 'shadow-sm'
            )}
            onClick={() => onSetActiveViewport('mobile')}
          >
            <Smartphone className="h-4 w-4" />
            Mobile
            <span className="text-xs opacity-70">({mobileSectionsCount})</span>
          </Button>
        </div>
      </div>

      {/* Mobile-specific options */}
      {isMobile && (
        <>
          <Separator />
          
          <div className="space-y-3">
            {/* Sync Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMobileSynced ? (
                  <Link className="h-4 w-4 text-primary" />
                ) : (
                  <Unlink className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="sync-toggle" className="text-sm cursor-pointer">
                  Sincronizar com Desktop
                </Label>
              </div>
              <Switch
                id="sync-toggle"
                checked={isMobileSynced}
                onCheckedChange={onSetMobileSynced}
              />
            </div>
            
            {isMobileSynced && (
              <p className="text-xs text-muted-foreground bg-primary/10 p-2 rounded-md">
                Alterações no Desktop são automaticamente aplicadas ao Mobile.
              </p>
            )}

            {/* Copy from Desktop (only when NOT synced) */}
            {!isMobileSynced && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={onCopyDesktopToMobile}
              >
                <Copy className="h-4 w-4" />
                Copiar tudo do Desktop
              </Button>
            )}

            {!isMobileSynced && (
              <p className="text-xs text-muted-foreground">
                Edição independente: Mobile pode ter conteúdo diferente do Desktop.
              </p>
            )}
          </div>
        </>
      )}

      {/* Desktop indicator */}
      {isDesktop && (
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Editando layout Desktop. Alterações {isMobileSynced ? 'serão espelhadas' : 'NÃO serão espelhadas'} no Mobile.
          </p>
        </>
      )}
    </div>
  );
}
