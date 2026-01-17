/**
 * ProductsTable Component - Refactored orchestrator
 * 
 * @see RISE Protocol V3 - 300-line limit compliance
 * @see RISE Protocol V2 - Zero direct database access from frontend
 */

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AddProductDialog } from "./AddProductDialog";
import { MinhasAfiliacoesContent } from "@/components/affiliations/MinhasAfiliacoesContent";
import {
  useProductsTable,
  ProductsHeader,
  ProductsSearchBar,
  ProductsTabNav,
  MeusProdutosTab,
} from "./products-table";

export function ProductsTable() {
  const {
    loading,
    searchQuery,
    statusFilter,
    activeTab,
    isAddDialogOpen,
    filteredProducts,
    setSearchQuery,
    setStatusFilter,
    setActiveTab,
    setIsAddDialogOpen,
    handleEdit,
    handleDuplicate,
    handleDelete,
    loadProducts,
    duplicateIsPending,
    deleteIsPending,
    Bridge,
  } = useProductsTable();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Bridge />
      <div className="space-y-6">
        <ProductsHeader onAddClick={() => setIsAddDialogOpen(true)} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <ProductsTabNav />

          <ProductsSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            activeTab={activeTab}
          />

          <TabsContent value="meus-produtos" className="mt-0">
            <MeusProdutosTab
              products={filteredProducts}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              duplicateIsPending={duplicateIsPending}
              deleteIsPending={deleteIsPending}
            />
          </TabsContent>

          <TabsContent value="minhas-coproducoes" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>Em breve: Gerencie suas co-produções aqui</p>
            </div>
          </TabsContent>

          <TabsContent value="minhas-afiliacoes" className="mt-0">
            <MinhasAfiliacoesContent />
          </TabsContent>
        </Tabs>

        <AddProductDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          onProductAdded={loadProducts}
        />
      </div>
    </>
  );
}
