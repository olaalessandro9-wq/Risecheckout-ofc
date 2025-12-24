/**
 * ProductDetails - Sheet Lateral de Detalhes do Produto
 * 
 * Sheet lateral com informações completas do produto
 * Design inspirado no Kirvano - Clean e minimalista
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Pencil,
  Users
} from "lucide-react";
import { useAffiliateRequest } from "@/hooks/useAffiliateRequest";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

interface ProductDetailsProps {
  product: MarketplaceProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Offer {
  id: string;
  name: string;
  type: string;
  price: number;
  commission: number;
  checkoutUrl: string;
}

export function ProductDetails({ product, open, onOpenChange }: ProductDetailsProps) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [maxCommission, setMaxCommission] = useState<number>(0);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  const {
    requestAffiliate,
    checkStatus,
    isLoading,
    error,
    success,
    affiliationStatus,
  } = useAffiliateRequest();

  // Verificar se o usuário é o dono do produto
  useEffect(() => {
    if (!product?.id || !open) {
      setIsOwner(false);
      setCheckingOwner(false);
      return;
    }

    const checkOwnership = async () => {
      setCheckingOwner(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && product.producer_id === user.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error("Erro ao verificar proprietário:", err);
        setIsOwner(false);
      } finally {
        setCheckingOwner(false);
      }
    };

    checkOwnership();
  }, [product?.id, product?.producer_id, open]);

  // Verificar status ao abrir (somente se não for o dono)
  useEffect(() => {
    if (product?.id && open && !isOwner && !checkingOwner) {
      checkStatus(product.id);
    }
  }, [product?.id, open, isOwner, checkingOwner, checkStatus]);

  // Mostrar toast de erro
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Mostrar toast de sucesso
  useEffect(() => {
    if (success) {
      toast.success(success);
      setTimeout(() => onOpenChange(false), 2000);
    }
  }, [success, onOpenChange]);

  // Buscar ofertas do produto
  useEffect(() => {
    if (!product || !open) return;

    const fetchOffers = async () => {
      setLoadingOffers(true);
      try {
        // Buscar ofertas do produto (status active)
        const { data: offersData, error } = await supabase
          .from("offers")
          .select("*")
          .eq("product_id", product.id)
          .eq("status", "active")
          .order("price", { ascending: false });

        if (error) throw error;

        if (offersData && offersData.length > 0) {
          // Mapear ofertas
          const mappedOffers: Offer[] = offersData.map((offer: any) => {
            const commission = (offer.price * (product.commission_percentage || 0)) / 100;
            return {
              id: offer.id,
              name: offer.name || "Oferta",
              type: offer.is_default ? "one_time" : "secondary",
              price: offer.price || 0,
              commission: commission,
              checkoutUrl: `${window.location.origin}/checkout/${offer.id}`,
            };
          });

          setOffers(mappedOffers);

          // Comissão máxima = preço do produto (maior oferta ou price da view) x comissão
          // Usamos o preço do produto da view (product.price) que é o preço principal
          const productPrice = product.price || mappedOffers[0]?.price || 0;
          const maxComm = (productPrice * (product.commission_percentage || 0)) / 100;
          setMaxCommission(maxComm);
        } else {
          setOffers([]);
          // Fallback: usar preço do produto
          const maxComm = ((product.price || 0) * (product.commission_percentage || 0)) / 100;
          setMaxCommission(maxComm);
        }
      } catch (error) {
        console.error("Erro ao buscar ofertas:", error);
        toast.error("Erro ao carregar ofertas do produto");
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [product, open]);

  if (!product) return null;

  // Formatar preço
  const formatPrice = (price: number | null) => {
    if (!price) return "Grátis";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  // Solicitar afiliação
  const handleRequest = async () => {
    if (!product.id) return;
    await requestAffiliate(product.id);
    await checkStatus(product.id);
  };

  const visibleOffers = showAllOffers ? offers : offers.slice(0, 2);

  // Renderizar botões para o produtor (dono do produto)
  const renderOwnerCTAButtons = () => {
    return (
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => {
            onOpenChange(false);
            navigate(`/dashboard/produtos/editar?id=${product.id}`);
          }}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          <Pencil className="w-4 h-4" />
          Editar Produto
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            onOpenChange(false);
            navigate(`/dashboard/afiliados`);
          }}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          <Users className="w-4 h-4" />
          Ver Afiliados
        </Button>
      </div>
    );
  };

  // Renderizar botão baseado no status (para não-donos)
  const renderCTAButton = () => {
    // Loading
    if (isLoading && !affiliationStatus) {
      return (
        <Button disabled className="w-full h-12 text-base font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
        </Button>
      );
    }

    // Já é afiliado - mostrar aprovado + navegar para detalhes
    if (affiliationStatus?.status === "active" && affiliationStatus.affiliationId) {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">Afiliação aprovada</div>
          <Button
            onClick={() => {
              onOpenChange(false);
              // Garante que o Sheet feche antes da navegação (evita clique “engolido”)
              setTimeout(() => {
                navigate(`/dashboard/minhas-afiliacoes/${affiliationStatus.affiliationId}`);
              }, 0);
            }}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            Ver afiliação
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Pendente de aprovação
    if (affiliationStatus?.status === "pending") {
      return (
        <Button disabled className="w-full h-12 text-base font-semibold gap-2 bg-amber-600">
          <Clock className="w-5 h-5" />
          Aguardando aprovação
        </Button>
      );
    }

    // Rejeitado
    if (affiliationStatus?.status === "rejected") {
      return (
        <Button disabled variant="destructive" className="w-full h-12 text-base font-semibold">
          Solicitação rejeitada
        </Button>
      );
    }

    // Botão padrão - Acessar produto
    return (
      <Button
        onClick={handleRequest}
        disabled={isLoading}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Acessar produto
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">
            {isOwner ? "Seu Produto" : "Visualizar afiliação"}
          </SheetTitle>
        </SheetHeader>

        {/* Header Card - Estilo Kirvano */}
        <div className="rounded-xl border bg-card p-4 mb-6">
          <div className="flex items-start gap-4">
            {/* Imagem */}
            {product.image_url && (
              <div className="flex-shrink-0">
                <img
                  src={product.image_url}
                  alt={product.name || "Produto"}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </div>
            )}

            {/* Informações */}
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="font-semibold text-base text-foreground leading-tight">
                {product.name}
              </h2>
              {isOwner ? (
                <Badge variant="secondary" className="text-xs">
                  Você é o produtor
                </Badge>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Por <span className="font-medium">{product.producer_name || "Produtor"}</span>
                  </p>
                  
                  {/* Destaque do Lucro - apenas para afiliados */}
                  {maxCommission > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Você pode lucrar até{" "}
                      <span className="font-bold text-foreground">
                        {formatPrice(maxCommission)}
                      </span>{" "}
                      por venda
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="space-y-4">
          
          {/* Status */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700">
              ● Ativo
            </Badge>
          </div>

          <Separator />

          {/* Descrição */}
          {product.marketplace_description && (
            <>
              <div className="py-2">
                <h3 className="text-sm font-medium text-foreground mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.marketplace_description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Tipo do Produto */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-foreground">Tipo do produto</span>
            <Badge variant="secondary">
              {product.marketplace_category || "digital"}
            </Badge>
          </div>

          <Separator />

          {/* Aprovação */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-foreground">Aprovação</span>
            {product.requires_manual_approval ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-700">
                ● Mediante análise
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700">
                ● Imediata
              </Badge>
            )}
          </div>

          <Separator />

          {/* Detalhes da Comissão */}
          <div className="py-2">
            <h3 className="text-sm font-medium text-foreground mb-2">Detalhes da Comissão</h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{product.commission_percentage || 0}% em ofertas de preço único</span>
              </div>
              {offers.some((o) => o.type === "recurring") && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{product.commission_percentage || 0}% em ofertas recorrentes</span>
                </div>
              )}
              {product.has_order_bump_commission && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Comissão também em Order Bumps e Upsells</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Ofertas disponíveis */}
          {offers.length > 0 && (
            <>
              <div className="py-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Ofertas disponíveis ({offers.length})
                  </h3>
                  {offers.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 px-2 text-primary hover:text-primary/80"
                      onClick={() => setShowAllOffers(!showAllOffers)}
                    >
                      {showAllOffers ? (
                        <>
                          Ver menos <ChevronUp className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Ver mais <ChevronDown className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {visibleOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{offer.name}</span>
                        {offer.type === "recurring" && (
                          <Badge variant="secondary" className="text-xs">
                            Recorrente
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium text-foreground">{formatPrice(offer.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Você recebe</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(offer.commission)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CTA - Botões diferenciados para dono vs afiliado */}
          <div className="pt-4 pb-2">
            {checkingOwner ? (
              <Button disabled className="w-full h-12 text-base font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
              </Button>
            ) : isOwner ? (
              renderOwnerCTAButtons()
            ) : (
              renderCTAButton()
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}