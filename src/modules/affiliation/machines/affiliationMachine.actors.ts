/**
 * AffiliationMachine Actors
 * 
 * Async actors for loading affiliation data.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module affiliation/machines
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { 
  LoadAffiliationInput, 
  LoadAffiliationOutput 
} from "./affiliationMachine.types";
import type {
  AffiliationDetails,
  AffiliationProduct,
  AffiliationOffer,
  AffiliationCheckout,
  ProducerProfile,
  AffiliatePixel,
  OtherProducerProduct,
} from "@/hooks/useAffiliationDetails";

const log = createLogger("AffiliationMachine.actors");

// ============================================================================
// LOAD AFFILIATION ACTOR
// ============================================================================

export const loadAffiliationActor = fromPromise<LoadAffiliationOutput, LoadAffiliationInput>(
  async ({ input }) => {
    const { affiliationId } = input;

    if (!affiliationId) {
      throw new Error("ID da afiliação não fornecido");
    }

    const { data, error } = await api.call<{
      error?: string;
      affiliation?: {
        id: string;
        affiliate_code: string;
        commission_rate: number;
        status: string;
        total_sales_count?: number;
        total_sales_amount?: number;
        created_at: string;
        product?: AffiliationProduct;
        offers?: AffiliationOffer[];
        checkouts?: AffiliationCheckout[];
        producer?: ProducerProfile;
        pixels?: AffiliatePixel[];
        pix_gateway?: string;
        credit_card_gateway?: string;
        allowed_gateways?: {
          pix_allowed: string[];
          credit_card_allowed: string[];
          require_gateway_connection: boolean;
        };
      };
      otherProducts?: OtherProducerProduct[];
    }>("get-affiliation-details", { affiliation_id: affiliationId });

    if (error) {
      log.error("Error loading affiliation:", error);
      throw new Error(error.message || "Erro ao buscar detalhes da afiliação");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (!data?.affiliation) {
      throw new Error("Afiliação não encontrada");
    }

    const affiliation: AffiliationDetails = {
      id: data.affiliation.id,
      affiliate_code: data.affiliation.affiliate_code,
      commission_rate: data.affiliation.commission_rate,
      status: data.affiliation.status,
      total_sales_count: data.affiliation.total_sales_count || 0,
      total_sales_amount: data.affiliation.total_sales_amount || 0,
      created_at: data.affiliation.created_at,
      product: data.affiliation.product as AffiliationProduct,
      offers: (data.affiliation.offers || []) as AffiliationOffer[],
      checkouts: (data.affiliation.checkouts || []) as AffiliationCheckout[],
      producer: data.affiliation.producer as ProducerProfile | null,
      pixels: (data.affiliation.pixels || []) as AffiliatePixel[],
      pix_gateway: data.affiliation.pix_gateway ?? null,
      credit_card_gateway: data.affiliation.credit_card_gateway ?? null,
      allowed_gateways: data.affiliation.allowed_gateways ?? {
        pix_allowed: [],
        credit_card_allowed: [],
        require_gateway_connection: false,
      },
    };

    return {
      affiliation,
      otherProducts: data.otherProducts || [],
    };
  }
);
