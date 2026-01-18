/**
 * ProductDetails - Sheet Lateral de Detalhes do Produto
 * 
 * Orquestrador principal que compõe os sub-componentes.
 * 
 * REFACTORED: De 504 linhas para ~130 linhas
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 * @see RISE Protocol V3 - 300 Line Limit
 */

import { useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAffiliateRequest } from "@/hooks/useAffiliateRequest";
import { useAffiliationStatusCache } from "@/hooks/useAffiliationStatusCache";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

// Sub-components
import { ProductHeader } from "./ProductHeader";
import { ProductInfo } from "./ProductInfo";
import { CommissionDetails } from "./CommissionDetails";
import { OffersList } from "./OffersList";
import { OwnerActions } from "./OwnerActions";
import { AffiliateActions } from "./AffiliateActions";

// Hooks
import { useProductOffers } from "./hooks/useProductOffers";
import { useOwnerCheck } from "./hooks/useOwnerCheck";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

interface ProductDetailsProps {
  product: MarketplaceProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetails({ product, open, onOpenChange }: ProductDetailsProps) {
  // Affiliation request hook
  const {
    requestAffiliate,
    isLoading,
    error,
    success,
  } = useAffiliateRequest();

  // Affiliation status cache
  const { getStatus, isLoaded: cacheLoaded, updateStatus, updateTrigger } = useAffiliationStatusCache();

  // Product offers hook
  const { offers, maxCommission } = useProductOffers({
    productId: product?.id || null,
    commissionPercentage: product?.commission_percentage || 0,
    productPrice: product?.price || 0,
    isOpen: open,
  });

  // Owner check hook
  const { isOwner, checkingOwner } = useOwnerCheck({
    productId: product?.id || null,
    producerId: product?.producer_id || null,
    isOpen: open,
  });

  // Affiliation status from cache (O(1) lookup)
  const affiliationStatus = useMemo(() => {
    if (!product?.id || !cacheLoaded) return null;
    const cached = getStatus(product.id);
    if (!cached) return null;
    return {
      isAffiliate: cached.status === "active",
      status: cached.status,
      affiliationId: cached.affiliationId,
    };
  }, [product?.id, cacheLoaded, getStatus, updateTrigger]);

  // Toast error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Toast success and close
  useEffect(() => {
    if (success) {
      toast.success(success);
      setTimeout(() => onOpenChange(false), 2000);
    }
  }, [success, onOpenChange]);

  // Handle affiliation request
  const handleRequest = async () => {
    if (!product?.id) return;
    await requestAffiliate(product.id);
    updateStatus(product.id, "pending");
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">
            {isOwner ? "Seu Produto" : "Visualizar afiliação"}
          </SheetTitle>
        </SheetHeader>

        <ProductHeader
          name={product.name}
          imageUrl={product.image_url}
          producerName={product.producer_name}
          maxCommission={maxCommission}
          isOwner={isOwner}
        />

        <div className="space-y-4">
          <ProductInfo
            description={product.marketplace_description}
            category={product.marketplace_category}
            requiresManualApproval={product.requires_manual_approval}
          />

          <CommissionDetails
            commissionPercentage={product.commission_percentage}
            hasOrderBumpCommission={product.has_order_bump_commission}
            offers={offers}
          />

          <OffersList offers={offers} />

          {/* CTA Section */}
          <div className="pt-4 pb-2">
            {checkingOwner ? (
              <Button disabled className="w-full h-12 text-base font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
              </Button>
            ) : isOwner ? (
              <OwnerActions
                productId={product.id!}
                onClose={() => onOpenChange(false)}
              />
            ) : (
              <AffiliateActions
                affiliationStatus={affiliationStatus}
                cacheLoaded={cacheLoaded}
                isLoading={isLoading}
                requiresManualApproval={product.requires_manual_approval}
                onRequest={handleRequest}
                onClose={() => onOpenChange(false)}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
