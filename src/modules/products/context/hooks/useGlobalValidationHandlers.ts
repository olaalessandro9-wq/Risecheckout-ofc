/**
 * useGlobalValidationHandlers - Registra TODOS os handlers de validação
 * 
 * CRITICAL: Este hook é chamado no ProductContext, que está SEMPRE montado.
 * Isso garante que a validação funciona independente de qual aba está ativa.
 * 
 * Handlers registrados:
 * - general (order: 10, tab: 'geral')
 * - checkout-settings (order: 20, tab: 'configuracoes')
 * - upsell (order: 30, tab: 'upsell')
 * - affiliate (order: 40, tab: 'afiliados')
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

import { useEffect, useCallback, useRef } from "react";
import type { RegisterSaveHandler } from "../../types/saveRegistry.types";
import type { GeneralFormData, CheckoutSettingsFormData, GatewayCredentials } from "../../types/productForm.types";
import type { UpsellSettings, AffiliateSettings, ProductData, Offer } from "../../types/product.types";
import { 
  validateGeneralForm, 
  validateUpsellSettings, 
  validateAffiliateSettings 
} from "../productFormValidation";
import { api } from "@/lib/api";
import { getGatewayById, isGatewayAvailable } from "@/config/payment-gateways";

// ============================================================================
// TYPES
// ============================================================================

interface UseGlobalValidationHandlersOptions {
  productId: string | null;
  userId: string | undefined;
  registerSaveHandler: RegisterSaveHandler;
  // General
  generalForm: GeneralFormData;
  product: ProductData | null;
  imageFile: File | null;
  pendingRemoval: boolean;
  uploadImage: () => Promise<string | null>;
  resetImage: () => void;
  saveDeletedOffers: () => Promise<void>;
  saveOffers: () => Promise<void>;
  resetOffers: () => void;
  // Checkout Settings
  checkoutSettingsForm: CheckoutSettingsFormData;
  isCheckoutSettingsInitialized: boolean;
  saveCheckoutSettings: () => Promise<void>;
  // Upsell
  upsellSettings: UpsellSettings;
  saveUpsellSettings: (settings: UpsellSettings) => Promise<void>;
  // Affiliate
  affiliateSettings: AffiliateSettings | null;
  saveAffiliateSettings: (settings: AffiliateSettings | null) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook que registra TODOS os handlers de validação no ProductContext.
 * 
 * Isso garante que a validação funciona INDEPENDENTE de qual aba está ativa,
 * pois o ProductContext está sempre montado.
 */
export function useGlobalValidationHandlers(options: UseGlobalValidationHandlersOptions): void {
  const {
    productId,
    userId,
    registerSaveHandler,
    generalForm,
    product,
    imageFile,
    pendingRemoval,
    uploadImage,
    resetImage,
    saveDeletedOffers,
    saveOffers,
    resetOffers,
    checkoutSettingsForm,
    isCheckoutSettingsInitialized,
    saveCheckoutSettings,
    upsellSettings,
    saveUpsellSettings,
    affiliateSettings,
    saveAffiliateSettings,
  } = options;

  // Refs para evitar stale closures
  const generalFormRef = useRef(generalForm);
  const upsellSettingsRef = useRef(upsellSettings);
  const affiliateSettingsRef = useRef(affiliateSettings);
  const checkoutSettingsFormRef = useRef(checkoutSettingsForm);
  const imageFileRef = useRef(imageFile);
  const pendingRemovalRef = useRef(pendingRemoval);

  // Atualizar refs
  useEffect(() => {
    generalFormRef.current = generalForm;
    upsellSettingsRef.current = upsellSettings;
    affiliateSettingsRef.current = affiliateSettings;
    checkoutSettingsFormRef.current = checkoutSettingsForm;
    imageFileRef.current = imageFile;
    pendingRemovalRef.current = pendingRemoval;
  }, [generalForm, upsellSettings, affiliateSettings, checkoutSettingsForm, imageFile, pendingRemoval]);

  useEffect(() => {
    if (!productId || !userId) return;

    const unregisterFns: Array<() => void> = [];

    // =========================================================================
    // HANDLER 1: General (order: 10, tab: 'geral')
    // =========================================================================
    const unregisterGeneral = registerSaveHandler(
      'general',
      async () => {
        const currentForm = generalFormRef.current;
        const currentImageFile = imageFileRef.current;
        const currentPendingRemoval = pendingRemovalRef.current;

        let finalImageUrl = product?.image_url || null;

        if (currentImageFile) {
          finalImageUrl = await uploadImage();
        } else if (currentPendingRemoval) {
          finalImageUrl = null;
        }

        const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
          action: 'update-general',
          productId,
          data: {
            name: currentForm.name,
            description: currentForm.description,
            price: currentForm.price,
            support_name: currentForm.support_name,
            support_email: currentForm.support_email,
            delivery_url: currentForm.external_delivery ? null : (currentForm.delivery_url || null),
            external_delivery: currentForm.external_delivery,
            status: "active",
            image_url: finalImageUrl,
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar produto');

        await saveDeletedOffers();
        await saveOffers();

        resetImage();
        resetOffers();
      },
      {
        validate: () => {
          const currentForm = generalFormRef.current;
          const result = validateGeneralForm(currentForm);
          const fieldErrors: Record<string, string> = {};
          
          if (result.errors.general) {
            Object.entries(result.errors.general).forEach(([field, error]) => {
              if (error) fieldErrors[field] = error;
            });
          }
          
          return {
            isValid: result.isValid,
            errors: fieldErrors,
            tabKey: 'geral',
          };
        },
        order: 10,
        tabKey: 'geral',
      }
    );
    unregisterFns.push(unregisterGeneral);

    // =========================================================================
    // HANDLER 2: Checkout Settings (order: 20, tab: 'configuracoes')
    // =========================================================================
    if (isCheckoutSettingsInitialized) {
      const unregisterCheckout = registerSaveHandler(
        'checkout-settings',
        saveCheckoutSettings,
        {
          validate: () => {
            const form = checkoutSettingsFormRef.current;
            const pixGateway = getGatewayById(form.pix_gateway);
            const ccGateway = getGatewayById(form.credit_card_gateway);
            const errors: Record<string, string> = {};
            let isValid = true;

            if (!isGatewayAvailable(form.pix_gateway)) {
              errors.pix_gateway = `Gateway de PIX "${pixGateway?.displayName || form.pix_gateway}" não está disponível`;
              isValid = false;
            }
            if (!isGatewayAvailable(form.credit_card_gateway)) {
              errors.credit_card_gateway = `Gateway de Cartão "${ccGateway?.displayName || form.credit_card_gateway}" não está disponível`;
              isValid = false;
            }

            return {
              isValid,
              errors,
              tabKey: 'configuracoes',
            };
          },
          order: 20,
          tabKey: 'configuracoes',
        }
      );
      unregisterFns.push(unregisterCheckout);
    }

    // =========================================================================
    // HANDLER 3: Upsell (order: 30, tab: 'upsell')
    // =========================================================================
    const unregisterUpsell = registerSaveHandler(
      'upsell',
      async () => {
        await saveUpsellSettings(upsellSettingsRef.current);
      },
      {
        validate: () => {
          const result = validateUpsellSettings(upsellSettingsRef.current);
          const fieldErrors: Record<string, string> = {};
          
          if (result.errors.upsell) {
            Object.entries(result.errors.upsell).forEach(([field, error]) => {
              if (error) fieldErrors[field] = error;
            });
          }
          
          return {
            isValid: result.isValid,
            errors: fieldErrors,
            tabKey: 'upsell',
          };
        },
        order: 30,
        tabKey: 'upsell',
      }
    );
    unregisterFns.push(unregisterUpsell);

    // =========================================================================
    // HANDLER 4: Affiliate (order: 40, tab: 'afiliados')
    // =========================================================================
    const unregisterAffiliate = registerSaveHandler(
      'affiliate',
      async () => {
        await saveAffiliateSettings(affiliateSettingsRef.current);
      },
      {
        validate: () => {
          const result = validateAffiliateSettings(affiliateSettingsRef.current);
          const fieldErrors: Record<string, string> = {};
          
          if (result.errors.affiliate) {
            Object.entries(result.errors.affiliate).forEach(([field, error]) => {
              if (error) fieldErrors[field] = error;
            });
          }
          
          return {
            isValid: result.isValid,
            errors: fieldErrors,
            tabKey: 'afiliados',
          };
        },
        order: 40,
        tabKey: 'afiliados',
      }
    );
    unregisterFns.push(unregisterAffiliate);

    // Cleanup
    return () => {
      unregisterFns.forEach(fn => fn());
    };
  }, [
    productId,
    userId,
    registerSaveHandler,
    product?.image_url,
    uploadImage,
    resetImage,
    saveDeletedOffers,
    saveOffers,
    resetOffers,
    isCheckoutSettingsInitialized,
    saveCheckoutSettings,
    saveUpsellSettings,
    saveAffiliateSettings,
  ]);
}
