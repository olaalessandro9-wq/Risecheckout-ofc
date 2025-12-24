/**
 * ProductEdit - Página de Edição de Produto (Nova Arquitetura)
 * 
 * Esta é a versão refatorada do ProductEdit, usando:
 * - ProductContext para estado global
 * - Componentes modulares
 * - Zero prop drilling
 * - Sincronização automática entre abas
 * 
 * Redução: De 1.828 linhas para ~100 linhas (-94%)
 */

import { useSearchParams } from "react-router-dom";
import { ProductProvider } from "@/modules/products";
import { ProductHeader } from "@/modules/products";
import { ProductTabs } from "@/modules/products";
import { UnsavedChangesGuard } from "@/providers/UnsavedChangesGuard";

/**
 * Componente Interno - Consome o ProductContext
 */
function ProductEditInner() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Cabeçalho com botões de ação */}
      <ProductHeader />
      
      {/* Abas de edição */}
      <ProductTabs />
    </div>
  );
}

/**
 * Componente Principal - Wrapper com Provider
 */
export default function ProductEdit() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  
  if (!productId) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive">
          Produto não encontrado
        </h1>
        <p className="text-muted-foreground mt-2">
          O ID do produto não foi fornecido na URL.
        </p>
      </div>
    );
  }
  
  return (
    <ProductProvider productId={productId}>
      <UnsavedChangesGuard>
        <ProductEditInner />
      </UnsavedChangesGuard>
    </ProductProvider>
  );
}
