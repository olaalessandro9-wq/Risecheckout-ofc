/**
 * SharedCheckoutGrid
 * 
 * Componente compartilhado para estrutura de grid do checkout
 * Usado por: Builder, Preview e Checkout Público
 * 
 * Garante que o layout de 2 colunas seja EXATAMENTE igual em todos os modos
 */

import React from 'react';

interface SharedCheckoutGridProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const SharedCheckoutGrid: React.FC<SharedCheckoutGridProps> = ({
  leftColumn,
  rightColumn,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* COLUNA ESQUERDA: Formulário e Informações */}
      <div className="space-y-6">
        {leftColumn}
      </div>

      {/* COLUNA DIREITA: Pagamento e Resumo (Desktop Only) */}
      <div className="hidden lg:block space-y-6">
        {rightColumn}
      </div>
    </div>
  );
};
