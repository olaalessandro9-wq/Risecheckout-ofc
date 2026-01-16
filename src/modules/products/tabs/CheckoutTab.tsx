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
import { useNavigate } from "react-router-dom";
import { CheckoutTable } from "@/components/products/CheckoutTable";
import { CheckoutConfigDialog } from "@/components/products/CheckoutConfigDialog";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { useBusy } from "@/components/BusyProvider";

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
   * MIGRATED: Uses product-entities Edge Function
   */
  const loadOffers = async () => {
    if (!product?.id) return;
    
    try {
      const sessionToken = localStorage.getItem('producer_session_token');
      
      const { data, error } = await supabase.functions.invoke('product-entities', {
        body: { action: 'offers', productId: product.id },
        headers: { 'x-producer-session-token': sessionToken || '' }
      });
      
      if (error) throw error;
      
      // Filter only active offers
      const activeOffers = (data?.offers || []).filter(
        (o: { status?: string }) => o.status === 'active'
      );
      setAvailableOffers(activeOffers);
    } catch (error: unknown) {
      console.error('Erro ao carregar ofertas:', error);
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
          const { id, editUrl } = await duplicateCheckout(checkout.id);
          
          // Recarregar checkouts
          await refreshCheckouts();
          
          toast.success("Checkout duplicado com sucesso!");
          
          // Navegar para personalização do novo checkout
          navigate(editUrl);
        },
        "Duplicando checkout..."
      );
    } catch (error: unknown) {
      console.error("Error duplicating checkout:", error);
      toast.error("Não foi possível duplicar o checkout");
    }
  };

  const handleDeleteCheckout = async (id: string, name: string) => {
    try {
      await confirm({
        resourceType: "Checkout",
        resourceName: name,
        onConfirm: async () => {
          console.log("[CHECKOUT DEBUG] Deletando checkout via Edge Function:", id);
          
          const sessionToken = localStorage.getItem('producer_session_token');
          
          const { data, error } = await supabase.functions.invoke('checkout-crud', {
            body: { action: 'delete', checkoutId: id },
            headers: { 'x-producer-session-token': sessionToken || '' }
          });
          
          if (error) {
            console.error("[CHECKOUT DEBUG] Edge Function error:", error);
            throw error;
          }
          
          if (!data?.success) {
            console.error("[CHECKOUT DEBUG] Delete failed:", data?.error);
            throw new Error(data?.error || 'Falha ao deletar checkout');
          }

          await refreshCheckouts();
          // Toast de sucesso é exibido pelo Bridge do useConfirmDelete
        },
      });
    } catch (error: unknown) {
      console.error("Error deleting checkout:", error);
      // Não mostrar erro se o usuário cancelou
      if (error instanceof Error && error.message !== "User cancelled") {
        toast.error("Não foi possível excluir o checkout");
      }
    }
  };

  /**
   * Configure checkout - load associated offer
   * MIGRATED: Uses checkout-public-data Edge Function
   */
  const handleConfigureCheckout = async (checkout: Checkout) => {
    setEditingCheckout(checkout);
    
    try {
      // Use the checkout-public-data Edge Function to get checkout with links
      const { data, error } = await supabase.functions.invoke('checkout-public-data', {
        body: { 
          action: 'get-checkout-offer',
          checkoutId: checkout.id
        }
      });

      if (error) {
        console.error("Error loading checkout offer:", error);
        setCurrentOfferId("");
      } else {
        setCurrentOfferId(data?.offerId || "");
      }
    } catch (error: unknown) {
      console.error("Error loading checkout offer:", error);
      setCurrentOfferId("");
    }
    
    setCheckoutConfigDialogOpen(true);
  };

  const handleCustomizeCheckout = (checkout: Checkout) => {
    navigate(`/dashboard/produtos/checkout/personalizar?id=${checkout.id}`);
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
