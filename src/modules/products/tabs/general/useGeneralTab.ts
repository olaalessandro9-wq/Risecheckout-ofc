/**
 * useGeneralTab - Hook com toda a lógica da aba Geral
 * 
 * Segue o padrão do useProductSettings:
 * - Gerencia estado do formulário
 * - Detecção automática de mudanças via useEffect
 * - Validação e salvamento
 * - Abstrai chamadas ao Supabase
 */

import { useState, useEffect, useMemo, useLayoutEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadViaEdge } from "@/lib/storage/storageProxy";
import { useAuth } from "@/hooks/useAuth";
import { useProductContext } from "../../context/ProductContext";
import type { Offer, MemberGroupOption } from "@/components/products/OffersManager";
import type { GeneralFormData, GeneralFormErrors, ImageState } from "./types";

export function useGeneralTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    product,
    offers,
    refreshOffers,
    refreshProduct,
    refreshPaymentLinks,
    deleteProduct,
    updateGeneralModified,
  } = useProductContext();

  // Estados do formulário
  const [form, setForm] = useState<GeneralFormData>({
    name: "",
    description: "",
    price: 0,
    support_name: "",
    support_email: "",
    delivery_url: "",
    external_delivery: false,
  });

  const [errors, setErrors] = useState<GeneralFormErrors>({
    name: "",
    description: "",
    price: "",
    support_name: "",
    support_email: "",
    delivery_url: "",
  });

  // Estados de imagem
  const [image, setImage] = useState<ImageState>({
    imageFile: null,
    imageUrl: "",
    pendingRemoval: false,
  });

  // Estados de ofertas
  const [localOffers, setLocalOffers] = useState<Offer[]>([]);
  const [deletedOfferIds, setDeletedOfferIds] = useState<string[]>([]);
  const [offersModified, setOffersModified] = useState(false);

  // Estados de grupos de acesso
  const [memberGroups, setMemberGroups] = useState<MemberGroupOption[]>([]);
  const [hasMembersArea, setHasMembersArea] = useState(false);

  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronizar form com product
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || "",
        price: product.price,
        support_name: product.support_name || "",
        support_email: product.support_email || "",
        delivery_url: product.delivery_url || "",
        external_delivery: product.external_delivery || false,
      });
    }
  }, [product]);

  // Sincronizar ofertas
  useEffect(() => {
    setLocalOffers(offers);
  }, [offers]);

  // Buscar grupos de acesso quando produto tem área de membros
  useEffect(() => {
    if (!product?.id) return;
    
    // Verificar se produto tem área de membros
    setHasMembersArea(product.members_area_enabled || false);
    
    if (product.members_area_enabled) {
      // Buscar grupos via edge function
      const fetchGroups = async () => {
        try {
          interface MemberGroupFromAPI {
            id: string;
            name: string;
            is_default?: boolean;
          }
          
          const sessionToken = localStorage.getItem('producer_session_token');
          const { data, error } = await supabase.functions.invoke('members-area-groups', {
            body: { action: 'list', product_id: product.id },
            headers: { 'x-producer-session-token': sessionToken || '' },
          });
          
          if (!error && data?.groups) {
            setMemberGroups(data.groups.map((g: MemberGroupFromAPI) => ({
              id: g.id,
              name: g.name,
              is_default: g.is_default,
            })));
          }
        } catch (err) {
          console.error('[useGeneralTab] Error fetching groups:', err);
        }
      };
      
      fetchGroups();
    } else {
      setMemberGroups([]);
    }
  }, [product?.id, product?.members_area_enabled]);

  // Detecção automática de mudanças (igual ConfiguracoesTab)
  const hasChanges = useMemo(() => {
    if (!product) return false;

    const formChanged = (
      form.name !== product.name ||
      form.description !== (product.description || "") ||
      form.price !== product.price ||
      form.support_name !== (product.support_name || "") ||
      form.support_email !== (product.support_email || "") ||
      form.delivery_url !== (product.delivery_url || "") ||
      form.external_delivery !== (product.external_delivery ?? false)
    );

    const imageChanged = image.imageFile !== null || image.pendingRemoval;

    return formChanged || imageChanged || offersModified || deletedOfferIds.length > 0;
  }, [form, product, image, offersModified, deletedOfferIds]);

  // Notificar contexto sobre mudanças (antes do paint)
  useLayoutEffect(() => {
    updateGeneralModified(hasChanges);
  }, [hasChanges, updateGeneralModified]);

  // Validação
  const validate = useCallback((): boolean => {
    const newErrors: GeneralFormErrors = {
      name: "",
      description: "",
      price: "",
      support_name: "",
      support_email: "",
      delivery_url: "",
    };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Nome do produto é obrigatório";
      valid = false;
    }

    if (form.description.trim().length < 100) {
      newErrors.description = "A descrição deve ter no mínimo 100 caracteres";
      valid = false;
    }

    if (!form.price || form.price <= 0) {
      newErrors.price = "Preço deve ser maior que zero";
      valid = false;
    }

    // Campos de suporte obrigatórios
    if (!form.support_name.trim()) {
      newErrors.support_name = "Nome de exibição é obrigatório";
      valid = false;
    }

    if (!form.support_email.trim()) {
      newErrors.support_email = "E-mail de suporte é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.support_email)) {
      newErrors.support_email = "E-mail inválido";
      valid = false;
    }

    // Validar delivery_url se fornecida
    if (form.delivery_url && !form.delivery_url.startsWith("https://")) {
      newErrors.delivery_url = "O link deve começar com https://";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form]);

  // Upload de imagem via Edge Function
  const uploadImage = useCallback(async (): Promise<string | null | undefined> => {
    if (!image.imageFile || !user || !product?.id) return product?.image_url;

    try {
      const fileExt = image.imageFile.name.split(".").pop();
      const fileName = `${user.id}/${product.id}.${fileExt}`;

      const { publicUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        fileName,
        image.imageFile,
        { upsert: true }
      );

      if (uploadError) throw uploadError;

      return publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Não foi possível fazer upload da imagem");
      throw error;
    }
  }, [image.imageFile, user, product?.id, product?.image_url]);

  // Salvar ofertas deletadas via Edge Function
  const saveDeletedOffers = useCallback(async () => {
    if (deletedOfferIds.length === 0) return;

    const sessionToken = localStorage.getItem('producer_session_token');
    
    for (const offerId of deletedOfferIds) {
      const { data, error } = await supabase.functions.invoke('offer-crud/delete', {
        body: { offerId },
        headers: { 'x-producer-session-token': sessionToken || '' }
      });
      
      if (error) {
        console.error('[useGeneralTab] Error deleting offer:', error);
        throw error;
      }
      if (!data?.success) {
        throw new Error(data?.error || 'Falha ao deletar oferta');
      }
    }
  }, [deletedOfferIds]);

  // Salvar ofertas modificadas via Edge Function
  const saveOffers = useCallback(async () => {
    if (!offersModified || !product?.id) return;

    const sessionToken = localStorage.getItem('producer_session_token');
    
    // Preparar dados para bulk save
    const offersToSave = localOffers.map(offer => ({
      id: offer.id.startsWith("temp-") ? undefined : offer.id,
      productId: product.id,
      name: offer.name,
      price: offer.price,
      isDefault: offer.is_default || false,
      memberGroupId: offer.member_group_id || null,
    }));
    
    const { data, error } = await supabase.functions.invoke('offer-bulk/bulk-save', {
      body: { productId: product.id, offers: offersToSave },
      headers: { 'x-producer-session-token': sessionToken || '' }
    });
    
    if (error) {
      console.error('[useGeneralTab] Error saving offers:', error);
      throw error;
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Falha ao salvar ofertas');
    }
  }, [offersModified, localOffers, product?.id]);

  // Handler de salvamento principal
  const handleSave = useCallback(async () => {
    if (!validate()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    if (!product?.id || !user) return;

    setIsSaving(true);

    try {
      let finalImageUrl = product.image_url;

      if (image.imageFile) {
        finalImageUrl = await uploadImage();
      } else if (image.pendingRemoval) {
        finalImageUrl = null;
      }

      // Use Edge Function for product update
      const sessionToken = localStorage.getItem('producer_session_token');
      const { data, error } = await supabase.functions.invoke('product-settings', {
        body: {
          action: 'update-general',
          productId: product.id,
          data: {
            name: form.name,
            description: form.description,
            price: form.price,
            support_name: form.support_name,
            support_email: form.support_email,
            delivery_url: form.external_delivery ? null : (form.delivery_url || null),
            external_delivery: form.external_delivery,
            status: "active",
            image_url: finalImageUrl,
          },
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao atualizar produto');

      await saveDeletedOffers();
      await saveOffers();

      toast.success("Produto salvo com sucesso");

      // Reset estados
      setImage({ imageFile: null, imageUrl: "", pendingRemoval: false });
      setOffersModified(false);
      setDeletedOfferIds([]);

      await refreshProduct();
      await refreshOffers();
      await refreshPaymentLinks();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Não foi possível salvar o produto");
    } finally {
      setIsSaving(false);
    }
  }, [
    validate,
    product,
    user,
    form,
    image,
    uploadImage,
    saveDeletedOffers,
    saveOffers,
    refreshProduct,
    refreshOffers,
    refreshPaymentLinks,
  ]);

  // Handler de exclusão
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await deleteProduct();
      if (!success) {
        // Lançar exceção para que ConfirmDeleteDialog capture o erro
        throw new Error("Falha ao excluir produto");
      }
      navigate("/dashboard/produtos");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteProduct, navigate]);

  // Handlers de imagem
  const handleImageFileChange = useCallback((file: File | null) => {
    setImage((prev) => ({ ...prev, imageFile: file, pendingRemoval: false }));
  }, []);

  const handleImageUrlChange = useCallback((url: string) => {
    setImage((prev) => ({ ...prev, imageUrl: url, pendingRemoval: false }));
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage((prev) => ({ ...prev, pendingRemoval: true }));
    toast.success("Imagem marcada para remoção. Clique em 'Salvar Alterações' para confirmar.");
  }, []);

  // Handlers de ofertas
  const handleOffersChange = useCallback((newOffers: Offer[]) => {
    setLocalOffers(newOffers);
  }, []);

  const handleOffersModifiedChange = useCallback((modified: boolean) => {
    setOffersModified(modified);
  }, []);

  const handleOfferDeleted = useCallback((offerId: string) => {
    setDeletedOfferIds((prev) => [...prev, offerId]);
  }, []);

  // Limpar erro ao editar campo
  const clearError = useCallback((field: keyof GeneralFormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  return {
    // Estados
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

    // Estados de grupos (para ofertas)
    memberGroups,
    hasMembersArea,

    // Handlers
    handleSave,
    handleDelete,
    handleImageFileChange,
    handleImageUrlChange,
    handleRemoveImage,
    handleOffersChange,
    handleOffersModifiedChange,
    handleOfferDeleted,
  };
}
