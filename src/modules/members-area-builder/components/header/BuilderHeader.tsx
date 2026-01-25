/**
 * Builder Header - Toolbar superior do builder
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Eye, 
  EyeOff,
  Save,
  Loader2,
} from 'lucide-react';
import type { BuilderState, BuilderActions } from '../../types/builder.types';

interface BuilderHeaderProps {
  productId: string;
  state: BuilderState;
  actions: BuilderActions;
}

export function BuilderHeader({ productId, state, actions }: BuilderHeaderProps) {
  const navigate = useNavigate();
  const { viewMode, isPreviewMode, isDirty, isSaving, activeViewport } = state;

  const handleBack = () => {
    if (isDirty) {
      // Could add confirmation dialog here
    }
    
    // Smart Exit: fecha aba se foi aberta via window.open(), senão navega
    if (window.opener) {
      window.close();
    } else {
      // Fallback para acesso direto via URL
      navigate(`/dashboard/produtos/editar?id=${productId}&section=members-area&tab=content`);
    }
  };

  const handleSave = async () => {
    await actions.save();
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4">
      {/* Left: Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="h-6 w-px bg-border" />
        
        <h1 className="font-semibold text-sm">
          Personalizar Área de Membros
        </h1>

        {/* Viewport indicator badge */}
        <Badge variant={activeViewport === 'desktop' ? 'default' : 'secondary'} className="gap-1">
          {activeViewport === 'desktop' ? (
            <>
              <Monitor className="h-3 w-3" />
              Desktop
            </>
          ) : (
            <>
              <Smartphone className="h-3 w-3" />
              Mobile
            </>
          )}
        </Badge>
      </div>

      {/* Center: View Mode Toggle (Preview) */}
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

      {/* Right: Preview & Save */}
      <div className="flex items-center gap-2">
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
  );
}
