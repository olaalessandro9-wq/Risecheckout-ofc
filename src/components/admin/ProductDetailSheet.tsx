/**
 * ProductDetailSheet - Painel de visualização read-only de produto
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 * 
 * Exibe detalhes completos do produto para owners verificarem conformidade
 * Modo somente leitura - nenhuma edição permitida
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, User, Mail, Tag, ImageIcon, Loader2 } from "lucide-react";

interface ProductDetailSheetProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: string | null;
  support_name: string | null;
  support_email: string | null;
  created_at: string | null;
  user_id: string | null;
}

interface Offer {
  id: string;
  name: string;
  price: number;
  status: string;
  is_default: boolean | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  deleted: "Removido",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  blocked: "bg-red-500/10 text-red-500 border-red-500/20",
  deleted: "bg-muted text-muted-foreground border-muted",
};

const formatCentsToBRL = (cents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

export function ProductDetailSheet({ productId, open, onOpenChange }: ProductDetailSheetProps) {
  /**
   * Fetch product details via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const { data, isLoading } = useQuery({
    queryKey: ["admin-product-detail", productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data: response, error } = await api.call<{
        error?: string;
        product?: ProductDetails;
        vendorName?: string;
        offers?: Offer[];
      }>("admin-data", {
        action: "product-detail-admin",
        productId,
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      
      return {
        product: response?.product as ProductDetails,
        vendorName: response?.vendorName as string,
        offers: response?.offers as Offer[],
      };
    },
    enabled: !!productId && open,
  });

  const product = data?.product;
  const vendorName = data?.vendorName || "Desconhecido";
  const offers = data?.offers || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes do Produto
          </SheetTitle>
          <SheetDescription>
            Visualização somente leitura para verificação de conformidade
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !product ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Produto não encontrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Status e Vendedor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={STATUS_COLORS[product.status || "active"]}>
                    {STATUS_LABELS[product.status || "active"]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vendedor</span>
                  <span className="text-sm font-medium">{vendorName}</span>
                </div>
              </div>

              <Separator />

              {/* Informações do Produto */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Produto
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Nome</label>
                    <p className="text-sm font-medium mt-0.5">{product.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">Descrição</label>
                    <p className="text-sm mt-0.5 text-foreground/80">
                      {product.description || <span className="italic text-muted-foreground">Sem descrição</span>}
                    </p>
                    {product.description && (
                      <span className="text-xs text-muted-foreground">
                        ({product.description.length} caracteres)
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Preço Base</label>
                    <p className="text-sm font-medium mt-0.5">
                      {formatCentsToBRL(product.price)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Imagem */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Imagem
                </h3>
                
                {product.image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/50">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-xs text-muted-foreground">Sem imagem</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Ofertas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Ofertas ({offers.length})
                </h3>
                
                {offers.length > 0 ? (
                  <div className="space-y-2">
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{offer.name}</span>
                          {offer.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Padrão
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium text-emerald-500">
                          {formatCentsToBRL(offer.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Nenhuma oferta cadastrada</p>
                )}
              </div>

              <Separator />

              {/* Suporte */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Suporte
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs text-muted-foreground">Nome</label>
                      <p className="text-sm">
                        {product.support_name || <span className="italic text-muted-foreground">Não informado</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-xs text-muted-foreground">Email</label>
                      <p className="text-sm">
                        {product.support_email || <span className="italic text-muted-foreground">Não informado</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
