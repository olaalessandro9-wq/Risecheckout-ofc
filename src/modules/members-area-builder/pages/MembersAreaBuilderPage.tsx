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

export function MembersAreaBuilderPage() {
  const { productId } = useParams<{ productId: string }>();
  const { state, actions } = useMembersAreaBuilder(productId);

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
    </div>
  );
}
