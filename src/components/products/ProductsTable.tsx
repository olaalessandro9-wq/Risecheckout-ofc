import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical } from "lucide-react";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddProductDialog } from "./AddProductDialog";
import { useBusy } from "@/components/BusyProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateProductDeep } from "@/lib/products/duplicateProduct";
import { deleteProductCascade } from "@/lib/products/deleteProduct";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { MinhasAfiliacoesContent } from "@/components/affiliations/MinhasAfiliacoesContent";

interface Product {
  id: string;
  name: string;
  price: number;
  status: "active" | "blocked" | "deleted";
  offers?: Array<{ price: number; is_default: boolean }>;
}

export function ProductsTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const busy = useBusy();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meus-produtos");

  const qc = useQueryClient();
  const { confirm, Bridge } = useConfirmDelete();

  const duplicateMutation = useMutation({
    mutationFn: async (productId: string) => {
      console.log('[ProductsTable] Duplicating product:', productId);
      return await busy.run(
        async () => {
          const { newProductId } = await duplicateProductDeep(supabase, productId);
          return newProductId;
        },
        "Duplicando produto..."
      );
    },
    onSuccess: async () => {
      toast.success("Produto duplicado com sucesso!");
      await loadProducts();
      await qc.invalidateQueries({ queryKey: ["products:list"] });
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(`Falha ao duplicar: ${err?.message ?? "erro desconhecido"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      console.log('[ProductsTable] Deleting product:', productId);
      await deleteProductCascade(supabase, productId);
    },
    onSuccess: async () => {
      await loadProducts();
      await qc.invalidateQueries({ queryKey: ["products:list"] });
    },
    onError: (err: Error) => {
      console.error('[deleteMutation] Error:', err);
      
      // Mensagens de erro mais amigáveis
      let errorMessage = "Erro ao excluir produto";
      
      if (err?.message?.includes('pedido')) {
        errorMessage = err.message;
      } else if (err?.message?.includes('foreign key')) {
        errorMessage = "Este produto possui dados vinculados e não pode ser excluído.";
      } else if (err?.message) {
        errorMessage = `Falha ao excluir: ${err.message}`;
      }
      
      toast.error(errorMessage);
    },
  });

  // FIXED: Use user?.id instead of user object to prevent infinite loop
  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          offers!inner(price, is_default)
        `)
        .eq("user_id", user.id)
        .neq("status", "deleted") // 🔥 Filtrar produtos com soft delete
        .eq("offers.is_default", true) // Apenas oferta principal
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error: unknown) {
      toast.error("Erro ao carregar produtos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/dashboard/produtos/editar?id=${productId}`);
  };

  const handleDuplicate = (productId: string) => {
    console.log('[handleDuplicate] Called with ID:', productId, 'Type:', typeof productId);
    duplicateMutation.mutate(productId);
  };

  const handleDelete = async (productId: string, productName: string) => {
    console.log('[handleDelete] Called with ID:', productId, 'Type:', typeof productId);
    await confirm({
      resourceType: "Produto",
      resourceName: productName,
      requireTypeToConfirm: true,
      onConfirm: async () => {
        deleteMutation.mutate(productId);
      },
    });
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === "all" || product.status === statusFilter)
  );

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
        {/* Header com botão Adicionar Produto */}
        <div className="flex justify-end">
          <Button 
            className="bg-success hover:bg-success/90 text-primary-foreground"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Adicionar Produto
          </Button>
        </div>

        {/* Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs de navegação */}
          <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start border-b border-border w-full rounded-none pb-0">
            <TabsTrigger 
              value="meus-produtos"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
            >
              Meus Produtos
            </TabsTrigger>
            <TabsTrigger 
              value="minhas-coproducoes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
            >
              Minhas Co-Produções
            </TabsTrigger>
            <TabsTrigger 
              value="minhas-afiliacoes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2 text-sm font-medium"
            >
              Minhas Afiliações
            </TabsTrigger>
          </TabsList>

          {/* Barra de pesquisa e Filtro de Status - FIXA EM TODAS AS ABAS */}
          <div className="flex items-center justify-between mt-6 mb-4 gap-4">
            {/* Barra de pesquisa à esquerda */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            
            {/* Filtro de Status à direita (apenas para Meus Produtos) */}
            {activeTab === "meus-produtos" && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-card border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Ativo e Bloqueado</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Conteúdo: Meus Produtos */}
          <TabsContent value="meus-produtos" className="mt-0">
            {/* Tabela de produtos */}
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Preço</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => handleEdit(product.id)}
                      >
                        <td className="p-4 text-foreground">{product.name}</td>
                        <td className="p-4 text-foreground">
                          {formatBRL(product.offers?.[0]?.price || product.price)}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={product.status === "active" ? "default" : "secondary"}
                            className={product.status === "active" ? "bg-success/20 text-success hover:bg-success/30" : ""}
                          >
                            {product.status === "active" ? "Ativo" : "Bloqueado"}
                          </Badge>
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDuplicate(product.id)}
                                disabled={duplicateMutation.isPending || deleteMutation.isPending}
                              >
                                {duplicateMutation.isPending ? "Duplicando..." : "Duplicar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={duplicateMutation.isPending || deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {filteredProducts.length > 0 && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    {"<"}
                  </Button>
                  <Button size="icon" className="w-8 h-8 bg-primary">
                    1
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    {">"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Conteúdo: Minhas Co-Produções */}
          <TabsContent value="minhas-coproducoes" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <p>Em breve: Gerencie suas co-produções aqui</p>
            </div>
          </TabsContent>

          {/* Conteúdo: Minhas Afiliações */}
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