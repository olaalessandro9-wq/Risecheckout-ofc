/**
 * BuyerProductContent Page
 * Displays product modules and content for buyers
 * 
 * @see RISE ARCHITECT PROTOCOL - Refatorado para compliance de 300 linhas
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";

// Components
import {
  BuyerProductHeader,
  ModuleSidebar,
  MobileModuleDrawer,
  ContentViewer,
  type Module,
  type ContentItem,
  type ProductData,
} from "./components";

export default function BuyerProductContent() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { fetchProductContent } = useBuyerOrders();

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch content on mount
  useEffect(() => {
    const loadContent = async () => {
      if (!productId || !isAuthenticated) return;

      setIsLoading(true);
      try {
        const data = await fetchProductContent(productId);
        if (data) {
          setProduct(data.product);
          setModules(data.modules as Module[]);
          // Auto-select first content if available
          if (data.modules[0]?.contents[0]) {
            setSelectedContent(data.modules[0].contents[0] as ContentItem);
          }
        } else {
          setError("Não foi possível carregar o conteúdo.");
        }
      } catch {
        setError("Erro ao carregar conteúdo.");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [productId, isAuthenticated, fetchProductContent]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link to="/minha-conta/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BuyerProductHeader product={product} modules={modules} />

      <div className="flex min-h-[calc(100vh-65px)]">
        <ModuleSidebar
          modules={modules}
          selectedContent={selectedContent}
          onSelectContent={setSelectedContent}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <ContentViewer content={selectedContent} />
        </main>
      </div>

      <MobileModuleDrawer
        modules={modules}
        selectedContent={selectedContent}
        onSelectContent={setSelectedContent}
      />
    </div>
  );
}
