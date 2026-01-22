/**
 * CheckoutTab - Aba de Gerenciamento de Checkouts
 * 
 * MIGRATED: Uses product-entities Edge Function for data fetching
 * 
 * Esta aba gerencia:
 * - Listagem de checkouts do produto
 * - Adicionar novo checkout
 * - Duplicar checkout existente
 * - Deletar checkout
 * - Configurar checkout (oferta associada)
 * - Customizar checkout (personalização visual)
 */

import { useState, useEffect } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger('CheckoutTab');
import { useNavigate } from "react-router-dom";
import { CheckoutTable } from "@/components/products/CheckoutTable";
import { CheckoutConfigDialog } from "@/components/products/CheckoutConfigDialog";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { useBusy } from "@/components/BusyProvider";

interface ProductEntitiesResponse {
  offers?: Array<{ id: string; name: string; price: number; is_default: boolean | null; status?: string }>;
  error?: string;
}

interface CheckoutCrudResponse {
  success?: boolean;
  error?: string;
}

// Tipo Checkout (igual ao CheckoutTable)
interface Checkout {
  id: string;
  name: string;
  price: number;
  visits: number;
  offer: string;
  isDefault: boolean;
  linkId: string;
}

export function CheckoutTab() {
  const { product, checkouts, refreshCheckouts } = useProductContext();
  const navigate = useNavigate();
  const { confirm, Bridge } = useConfirmDelete();
  const busy = useBusy();

  const [checkoutConfigDialogOpen, setCheckoutConfigDialogOpen] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState<Checkout | null>(null);
  const [currentOfferId, setCurrentOfferId] = useState<string>("");
  const [configuringCheckoutId, setConfiguringCheckoutId] = useState<string | null>(null);
  
  // Interface para ofertas disponíveis
  interface AvailableOffer {
    id: string;
    name: string;
    price: number;
    is_default: boolean | null;
  }

  const [availableOffers, setAvailableOffers] = useState<AvailableOffer[]>([]);

  // Carregar ofertas do produto
  useEffect(() => {
    if (product?.id) {
      loadOffers();
    }
  }, [product?.id]);

  /**
   * Load offers via Edge Function
   * MIGRATED: Uses product-entities Edge Function via api.call
   */
  const loadOffers = async () => {
    if (!product?.id) return;
    
    try {
      const { data, error } = await api.call<ProductEntitiesResponse>('product-entities', {
        action: 'offers',
        productId: product.id,
      });
      
      if (error) throw new Error(error.message);
      
      // Filter only active offers
      const activeOffers = (data?.offers || []).filter(
        (o) => o.status === 'active'
      );
      setAvailableOffers(activeOffers);
    } catch (error: unknown) {
      log.error('Erro ao carregar ofertas', error);
    }
  };

  const handleAddCheckout = () => {
    setEditingCheckout(null);
    setCurrentOfferId("");
    setCheckoutConfigDialogOpen(true);
  };

  const handleDuplicateCheckout = async (checkout: Checkout) => {
    try {
      await busy.run(
        async () => {
          const { duplicateCheckout } = await import("@/lib/checkouts/duplicateCheckout");
          await duplicateCheckout(checkout.id);
          
          // Recarregar checkouts para mostrar o novo item na lista
          await refreshCheckouts();
          
          toast.success("Checkout duplicado com sucesso! Clique em 'Customizar' para personalizá-lo.");
        },
        "Duplicando checkout..."
      );
    } catch (error: unknown) {
      log.error('Erro ao duplicar checkout', error);
      toast.error("Não foi possível duplicar o checkout");
    }
  };

  const handleDeleteCheckout = async (id: string, name: string) => {
    try {
      await confirm({
        resourceType: "Checkout",
        resourceName: name,
        onConfirm: async () => {
          log.debug('Deletando checkout via Edge Function', { id });
          
          const { data, error } = await api.call<CheckoutCrudResponse>('checkout-crud', {
            action: 'delete',
            checkoutId: id,
          });
          
          if (error) {
            log.error('Edge Function retornou erro', error);
            throw new Error(error.message);
          }
          
          if (!data?.success) {
            log.error('Falha ao deletar', { error: data?.error });
            throw new Error(data?.error || 'Falha ao deletar checkout');
          }

          await refreshCheckouts();
          // Toast de sucesso é exibido pelo Bridge do useConfirmDelete
        },
      });
    } catch (error: unknown) {
      log.error('Erro ao deletar checkout', error);
      // Não mostrar erro se o usuário cancelou
      if (error instanceof Error && error.message !== "User cancelled") {
        toast.error("Não foi possível excluir o checkout");
      }
    }
  };

  /**
   * Configure checkout - load associated offer
   * MIGRATED: Uses api.publicCall()
   */
  const handleConfigureCheckout = async (checkout: Checkout) => {
    setConfiguringCheckoutId(checkout.id);
    setEditingCheckout(checkout);
    
    try {
      // Use api.publicCall for public checkout data
      const { data, error } = await api.publicCall<{ offerId?: string }>('checkout-public-data', { 
        action: 'get-checkout-offer',
        checkoutId: checkout.id
      });

      if (error) {
        log.error('Erro ao carregar oferta do checkout', error);
        setCurrentOfferId("");
      } else {
        setCurrentOfferId(data?.offerId || "");
      }
    } catch (error: unknown) {
      log.error('Erro ao carregar oferta do checkout', error);
      setCurrentOfferId("");
    } finally {
      setConfiguringCheckoutId(null);
    }
    
    setCheckoutConfigDialogOpen(true);
  };

  const handleCustomizeCheckout = (checkout: Checkout) => {
    // Abre o builder em nova aba (padrão Kiwify/Cakto/Hotmart)
    // Isso preserva o contexto da página de produtos e evita conflitos com UnsavedChangesGuard
    window.open(`/dashboard/produtos/checkout/personalizar?id=${checkout.id}`, '_blank');
  };

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando checkouts...</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Checkouts</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Crie e personalize diferentes checkouts para seus produtos
        </p>
      </div>
      <CheckoutTable
        checkouts={checkouts}
        onAdd={handleAddCheckout}
        onDuplicate={handleDuplicateCheckout}
        onDelete={handleDeleteCheckout}
        onConfigure={handleConfigureCheckout}
        onCustomize={handleCustomizeCheckout}
        configuringId={configuringCheckoutId}
      />
      
      <CheckoutConfigDialog
        open={checkoutConfigDialogOpen}
        onOpenChange={setCheckoutConfigDialogOpen}
        checkout={editingCheckout || undefined}
        availableOffers={availableOffers}
        currentOfferId={currentOfferId}
        productId={product.id}
        onSave={async () => {
          await refreshCheckouts();
          await loadOffers();
        }}
      />
      
      <Bridge />
    </div>
  );
}
