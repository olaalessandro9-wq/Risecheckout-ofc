/**
 * LessonViewer Page - Individual Lesson View
 * Displays lesson content with right sidebar navigation (Cakto-style)
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerProductContent } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

import {
  LessonLayout,
  LessonHeader,
  LessonContent,
  CaktoStyleSidebar,
  LessonMobileSheet,
} from "./components/lesson";
import type { Module, ContentItem, ProductData } from "./components/types";

export default function LessonViewer() {
  const navigate = useNavigate();
  const { productId, contentId } = useParams<{
    productId: string;
    contentId: string;
  }>();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();

  // React Query declarativo
  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useBuyerProductContent(productId);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derived state from query data
  const product = data?.product as ProductData | null;
  const modules = (data?.modules as Module[]) || [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = authLoading || queryLoading;
  const error = queryError ? "Erro ao carregar conteúdo." : null;

  // Find current content and module + build navigation list
  const { currentContent, currentModule, allContents, currentIndex } =
    useMemo(() => {
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

      const currentIndex = allContents.findIndex(
        (c) => c.content.id === contentId
      );

      return { currentContent, currentModule, allContents, currentIndex };
    }, [modules, contentId]);

  // Navigation handlers
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

  const handleSelectContent = (content: ContentItem, _module: Module) => {
    navigate(`/minha-conta/produto/${productId}/aula/${content.id}`);
    setMobileMenuOpen(false);
  };

  const handleComplete = () => {
    // TODO: Integrate with progress tracking API
    if (hasNext) {
      goToNext();
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error or not found state
  if (error || !currentContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <p className="text-destructive">
            {error || "Conteúdo não encontrado"}
          </p>
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
      <LessonHeader
        productId={productId!}
        productName={product?.name || null}
        lessonTitle={currentContent.title}
        moduleName={currentModule?.title || null}
        currentIndex={currentIndex}
        totalLessons={allContents.length}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Main Layout */}
      <LessonLayout
        sidebar={
          <CaktoStyleSidebar
            modules={modules}
            currentModuleId={currentModule?.id || null}
            currentContentId={contentId || null}
            onSelectContent={handleSelectContent}
            completedContentIds={[]}
          />
        }
      >
        <LessonContent
          content={currentContent}
          contentId={contentId!}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onComplete={handleComplete}
        />
      </LessonLayout>

      {/* Mobile Navigation Sheet */}
      <LessonMobileSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        modules={modules}
        currentModuleId={currentModule?.id || null}
        currentContentId={contentId || null}
        onSelectContent={handleSelectContent}
        completedContentIds={[]}
      />
    </div>
  );
}
