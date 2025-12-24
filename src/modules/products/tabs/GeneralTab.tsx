/**
 * GeneralTab - Aba Geral (Arquitetura Modular)
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL:
 * - De 525 linhas para ~60 linhas (-88%)
 * - Hook useGeneralTab com toda a lógica
 * - Sub-componentes focados (Single Responsibility)
 * - Zero prop drilling via hook
 * - Detecção automática de mudanças
 */

import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import {
  useGeneralTab,
  ProductInfoSection,
  ProductImageSection,
  ProductOffersSection,
  ProductSupportSection,
  GeneralTabActions,
} from "./general";

export function GeneralTab() {
  const { confirm, Bridge: ConfirmDeleteBridge } = useConfirmDelete();

  const {
    product,
    form,
    setForm,
    errors,
    clearError,
    image,
    localOffers,
    hasChanges,
    isSaving,
    isDeleting,
    handleSave,
    handleDelete,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  } = useGeneralTab();

  // Handler de exclusão com confirmação
  const onDeleteClick = () => {
    if (!product) return;

    confirm({
      resourceType: "Produto",
      resourceName: product.name,
      requireTypeToConfirm: true,
      description:
        "Esta ação não pode ser desfeita. Todos os checkouts e links associados serão removidos ou desativados.",
      onConfirm: handleDelete,
    });
  };

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
        />

        <ProductSupportSection
          form={form}
          setForm={setForm}
          errors={errors}
          clearError={clearError}
        />

        <GeneralTabActions
          hasChanges={hasChanges}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onSave={handleSave}
          onDelete={onDeleteClick}
        />
      </div>

      <ConfirmDeleteBridge />
    </>
  );
}
