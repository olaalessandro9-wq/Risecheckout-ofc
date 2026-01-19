import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { uploadViaEdge } from "@/lib/storage/storageProxy";

const log = createLogger("UseProduct");

export interface ProductData {
  id?: string;
  name: string;
  description: string;
  price: number;  // Centavos (inteiro)
  image_url: string | null;
  support_name: string;
  support_email: string;
  status: "active" | "blocked";
}

export const useProduct = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const productId = searchParams.get("id");
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (productId && user) {
      loadProduct();
    }
  }, [productId, user]);

  /**
   * Load product via Edge Function
   * MIGRATED: Uses api.call instead of supabase.functions.invoke
   */
  const loadProduct = async (showLoading = true) => {
    if (!productId || !user) return;

    if (showLoading) {
      setLoading(true);
    }
    try {
      const { data: response, error } = await api.call<{
        product?: {
          id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          support_name: string;
          support_email: string;
          status: string;
        };
        error?: string;
      }>('products-crud', {
        action: 'get',
        productId,
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      
      const data = response?.product;
      if (!data) throw new Error("Produto não encontrado");
      
      setProduct({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,
        image_url: data.image_url,
        support_name: data.support_name || "",
        support_email: data.support_email || "",
        status: data.status as "active" | "blocked",
      });
    } catch (error: unknown) {
      toast.error("Erro ao carregar produto");
      log.error("Error loading product:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user || !productId) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${productId}.${fileExt}`;

      const { publicUrl, error: uploadError } = await uploadViaEdge(
        "product-images",
        fileName,
        imageFile,
        { upsert: true }
      );

      if (uploadError) throw uploadError;

      return publicUrl;
    } catch (error: unknown) {
      toast.error("Erro ao fazer upload da imagem");
      log.error("Error uploading image:", error);
      return null;
    }
  };

  const saveProduct = async (productData: Partial<ProductData>) => {
    // Validar se o usuário está autenticado
    if (!user) {
      toast.error("Você precisa estar autenticado para salvar produtos");
      log.error("User not authenticated");
      return;
    }

    // Validar campos obrigatórios
    if (!productData.name || productData.name.trim() === "") {
      toast.error("O nome do produto é obrigatório");
      return;
    }

    if (!productData.price || productData.price <= 0) {
      toast.error("O preço do produto deve ser maior que zero");
      return;
    }

    try {
      // Usar image_url do productData se fornecido (permite null para remover)
      let imageUrl = productData.image_url !== undefined ? productData.image_url : product?.image_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      if (productId) {
        // Update via Edge Function
        const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-crud', {
          action: 'update',
          product: {
            productId,
            name: productData.name.trim(),
            description: productData.description?.trim() || "",
            support_name: productData.support_name?.trim() || "",
            support_email: productData.support_email?.trim() || "",
            status: productData.status || "active",
            image_url: imageUrl,
            price: productData.price,
          },
        });

        if (error) {
          log.error("Error updating product:", error);
          throw new Error(error.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Erro ao atualizar produto");
        }

        toast.success("Produto atualizado com sucesso");
        await loadProduct(false);
      } else {
        // Create via Edge Function
        const { data, error } = await api.call<{ success?: boolean; error?: string; product?: { id: string; name: string; description: string; price: number; image_url: string | null; support_name: string; support_email: string; status: string } }>('product-crud', {
          action: 'create',
          product: {
            name: productData.name.trim(),
            description: productData.description?.trim() || "",
            support_name: productData.support_name?.trim() || "",
            support_email: productData.support_email?.trim() || "",
            status: productData.status || "active",
            image_url: imageUrl,
            price: productData.price,
          },
        });

        if (error) {
          log.error("Error creating product:", error);
          throw new Error(error.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Erro ao criar produto");
        }
        
        toast.success("Produto criado com sucesso");
        
        setProduct({
          id: data.product.id,
          name: data.product.name || "",
          description: data.product.description || "",
          price: data.product.price || 0,
          image_url: data.product.image_url,
          support_name: data.product.support_name || "",
          support_email: data.product.support_email || "",
          status: data.product.status as "active" | "blocked",
        });
        
        // Redirecionar para a página de edição do produto criado
        navigate(`/dashboard/produtos/editar?id=${data.product.id}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      // Melhorar mensagens de erro
      if (errorMessage.includes("401") || errorMessage.includes("Não autorizado")) {
        toast.error("Sessão expirada. Faça login novamente.");
      } else if (errorMessage.includes("403")) {
        toast.error("Você não tem permissão para editar este produto.");
      } else {
        toast.error(`Erro ao salvar produto: ${errorMessage}`);
      }
      log.error("Error saving product:", error);
      throw error;
    }
  };

  const deleteProduct = async () => {
    if (!productId || !user) return false;

    try {
      const { data, error } = await api.call<{ success?: boolean; error?: string }>("product-crud", {
        action: 'delete',
        productId,
      });

      if (error) {
        log.error("Error deleting product:", error);
        toast.error("Erro ao excluir produto", { description: error.message });
        return false;
      }

      if (!data?.success) {
        toast.error("Erro ao excluir produto", { description: data?.error });
        return false;
      }

      toast.success("Produto excluído com sucesso");
      return true;
    } catch (error: unknown) {
      toast.error(`Erro ao excluir produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      return false;
    }
  };

  return {
    product,
    loading,
    imageFile,
    setImageFile,
    saveProduct,
    deleteProduct,
    loadProduct,
    productId,
  };
};

