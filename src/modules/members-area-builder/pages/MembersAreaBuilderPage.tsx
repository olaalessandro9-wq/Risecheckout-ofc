/**
 * Members Area Builder Page - Página principal do builder
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useMembersAreaBuilder } from '../hooks/useMembersAreaBuilder';
import { BuilderHeader } from '../components/header/BuilderHeader';
import { BuilderCanvas } from '../components/canvas/BuilderCanvas';
import { BuilderSidebar } from '../components/sidebar/BuilderSidebar';
import { EditMemberModuleDialog } from '../components/dialogs/EditMemberModuleDialog';

export function MembersAreaBuilderPage() {
  const { productId } = useParams<{ productId: string }>();
  const { state, actions } = useMembersAreaBuilder(productId);

  // Find selected module for editing
  const selectedModule = state.selectedModuleId 
    ? state.modules.find(m => m.id === state.selectedModuleId) ?? null
    : null;

  if (!productId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <BuilderHeader 
        productId={productId} 
        state={state} 
        actions={actions} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        <BuilderCanvas 
          state={state} 
          actions={actions} 
        />
        
        {!state.isPreviewMode && (
          <BuilderSidebar 
            state={state} 
            actions={actions} 
          />
        )}
      </div>

      {/* Module Edit Dialog */}
      <EditMemberModuleDialog
        open={state.isEditingModule}
        onOpenChange={(open) => {
          actions.setEditingModule(open);
          if (!open) actions.selectModule(null);
        }}
        module={selectedModule}
        onUpdate={actions.updateModule}
      />
    </div>
  );
}
