/**
 * GeneralTab - Aba Geral (Arquitetura Modular)
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL V3:
 * - De 525 linhas para ~60 linhas (-88%)
 * - Hook useGeneralTab com toda a lógica
 * - Sub-componentes focados (Single Responsibility)
 * - Zero prop drilling via hook
 * - Detecção automática de mudanças
 * - Salvamento unificado via botão global "Salvar Produto" (header)
 */


import {
  useGeneralTab,
  ProductInfoSection,
  ProductImageSection,
  ProductOffersSection,
  ProductSupportSection,
  ProductDeliverySection,
} from "./general";
import { usePermissions } from "@/hooks/usePermissions";

export function GeneralTab() {
  const { canAccessMembersArea } = usePermissions();

  const {
    product,
    form,
    setForm,
    errors,
    clearError,
    image,
    localOffers,
    memberGroups,
    hasMembersArea,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  } = useGeneralTab();

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-8 space-y-8">
        <ProductInfoSection
          form={form}
          setForm={setForm}
          errors={errors}
          clearError={clearError}
        />

        <ProductImageSection
          currentImageUrl={product.image_url}
          image={image}
          onImageFileChange={handleImageFileChange}
          onImageUrlChange={handleImageUrlChange}
          onRemoveImage={handleRemoveImage}
        />

        <ProductOffersSection
          productId={product.id}
          form={form}
          offers={localOffers}
          onOffersChange={handleOffersChange}
          onModifiedChange={handleOffersModifiedChange}
          onOfferDeleted={handleOfferDeleted}
          memberGroups={memberGroups}
          hasMembersArea={hasMembersArea}
          canAccessMembersArea={canAccessMembersArea}
        />

        <ProductSupportSection
          form={form}
          setForm={setForm}
          errors={errors}
          clearError={clearError}
        />

        <ProductDeliverySection
          form={form}
          setForm={setForm}
        />
      </div>
    </>
  );
}
