/**
 * CourseHome Page - Netflix-style Course Landing
 * Displays hero banner and module carousel
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

import { HeroBanner, ModuleCarousel } from "./components/netflix";
import type { Module, ContentItem, ProductData } from "./components/types";

export default function CourseHome() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { fetchProductContent } = useBuyerOrders();

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
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

  // Handle starting course (first lesson)
  const handleStartCourse = () => {
    if (modules.length > 0 && modules[0].contents.length > 0) {
      const firstContent = modules[0].contents[0];
      navigate(`/minha-conta/produto/${productId}/aula/${firstContent.id}`);
    }
  };

  // Handle selecting a content from carousel
  const handleSelectContent = (content: ContentItem, module: Module) => {
    navigate(`/minha-conta/produto/${productId}/aula/${content.id}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-destructive">{error}</p>
          <Link to="/minha-conta/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Meus Cursos
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button - Floating */}
      <div className="absolute top-4 left-4 z-30">
        <Link to="/minha-conta/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Hero Banner */}
      <HeroBanner
        product={product}
        modules={modules}
        onStartCourse={handleStartCourse}
      />

      {/* Module Carousel */}
      <ModuleCarousel
        modules={modules}
        onSelectContent={handleSelectContent}
      />

      {/* Spacer for bottom */}
      <div className="h-16" />
    </div>
  );
}
