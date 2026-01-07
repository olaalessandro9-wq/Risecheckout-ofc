/**
 * LessonViewer Page - Individual Lesson View
 * Displays lesson content with right sidebar navigation (Cakto-style)
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Check, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ContentViewer } from "./components/ContentViewer";
import { LessonSidebar } from "./components/lesson";
import type { Module, ContentItem, ProductData } from "./components/types";

export default function LessonViewer() {
  const navigate = useNavigate();
  const { productId, contentId } = useParams<{ productId: string; contentId: string }>();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { fetchProductContent } = useBuyerOrders();

  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Find current content and module
  const { currentContent, currentModule, allContents, currentIndex } = useMemo(() => {
    const allContents: { content: ContentItem; module: Module }[] = [];
    let currentContent: ContentItem | null = null;
    let currentModule: Module | null = null;

    for (const module of modules) {
      for (const content of module.contents) {
        allContents.push({ content, module });
        if (content.id === contentId) {
          currentContent = content;
          currentModule = module;
        }
      }
    }

    const currentIndex = allContents.findIndex((c) => c.content.id === contentId);

    return { currentContent, currentModule, allContents, currentIndex };
  }, [modules, contentId]);

  // Navigation
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allContents.length - 1;

  const goToPrevious = () => {
    if (hasPrevious) {
      const prev = allContents[currentIndex - 1];
      navigate(`/minha-conta/produto/${productId}/aula/${prev.content.id}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      const next = allContents[currentIndex + 1];
      navigate(`/minha-conta/produto/${productId}/aula/${next.content.id}`);
    }
  };

  const handleSelectContent = (content: ContentItem, module: Module) => {
    navigate(`/minha-conta/produto/${productId}/aula/${content.id}`);
    setMobileMenuOpen(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !currentContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-destructive">{error || "Conteúdo não encontrado"}</p>
          <Link to={`/minha-conta/produto/${productId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o Curso
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Back Button */}
          <Link to={`/minha-conta/produto/${productId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{product?.name || "Voltar"}</span>
            </Button>
          </Link>

          {/* Current Lesson Title - Desktop */}
          <div className="hidden md:block text-center flex-1 px-4">
            <p className="text-sm font-medium truncate">{currentContent.title}</p>
            <p className="text-xs text-muted-foreground">
              {currentModule?.title} • Aula {currentIndex + 1} de {allContents.length}
            </p>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <LessonSidebar
                  modules={modules}
                  currentModuleId={currentModule?.id || null}
                  currentContentId={contentId || null}
                  onSelectContent={handleSelectContent}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={contentId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto p-6"
          >
            <ContentViewer content={currentContent} />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={!hasPrevious}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {hasNext ? (
                <Button onClick={goToNext} className="gap-2">
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4" />
                  Concluir Curso
                </Button>
              )}
            </div>
          </motion.div>
        </main>

        {/* Right Sidebar - Desktop */}
        <LessonSidebar
          modules={modules}
          currentModuleId={currentModule?.id || null}
          currentContentId={contentId || null}
          onSelectContent={handleSelectContent}
        />
      </div>
    </div>
  );
}
