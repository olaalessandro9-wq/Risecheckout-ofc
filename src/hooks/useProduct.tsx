import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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

  const loadProduct = async (showLoading = true) => {
    if (!productId || !user) return;

    if (showLoading) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      setProduct({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        price: data.price || 0,  // Centavos
        image_url: data.image_url,
        support_name: data.support_name || "",
        support_email: data.support_email || "",
        status: data.status as "active" | "blocked",
      });
    } catch (error: unknown) {
      toast.error("Erro ao carregar produto");
      console.error("Error loading product:", error);
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

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: unknown) {
      toast.error("Erro ao fazer upload da imagem");
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const saveProduct = async (productData: Partial<ProductData>) => {
    // Validar se o usuário está autenticado
    if (!user) {
      toast.error("Você precisa estar autenticado para salvar produtos");
      console.error("User not authenticated");
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

    // Get session token
    const sessionToken = localStorage.getItem("rise_producer_token");
    if (!sessionToken) {
      toast.error("Sessão expirada. Faça login novamente.");
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
        const { data, error } = await supabase.functions.invoke("product-crud", {
          body: {
            action: 'update',
            sessionToken,
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
          },
        });

        if (error) {
          console.error("Error updating product:", error);
          throw new Error(error.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Erro ao atualizar produto");
        }

        toast.success("Produto atualizado com sucesso");
        await loadProduct(false);
      } else {
        // Create via Edge Function
        const { data, error } = await supabase.functions.invoke("product-crud", {
          body: {
            action: 'create',
            sessionToken,
            product: {
              name: productData.name.trim(),
              description: productData.description?.trim() || "",
              support_name: productData.support_name?.trim() || "",
              support_email: productData.support_email?.trim() || "",
              status: productData.status || "active",
              image_url: imageUrl,
              price: productData.price,
            },
          },
        });

        if (error) {
          console.error("Error creating product:", error);
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
      console.error("Error saving product:", error);
      throw error;
    }
  };

  const deleteProduct = async () => {
    if (!productId || !user) return false;

    // Get session token
    const sessionToken = localStorage.getItem("rise_producer_token");
    if (!sessionToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("product-crud", {
        body: {
          action: 'delete',
          productId,
        },
      });

      if (error) {
        console.error("Error deleting product:", error);
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

