/**
 * PremiumLessonViewer Page - Premium Individual Lesson View
 * RiseCheckout exclusive design with superior UI/UX
 * 
 * Features:
 * - Premium sidebar with timeline visualization
 * - Glassmorphism effects
 * - Smooth micro-interactions
 * - Professional gradient accents
 * 
 * RISE V3: Uses useUnifiedAuth (unified identity)
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useBuyerProductContent } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";

import {
  LessonLayout,
  PremiumHeader,
  PremiumLessonContent,
  PremiumSidebar,
  PremiumMobileSheet,
} from "./components/lesson";
import type { Module, ContentItem, ProductData } from "./components/types";

export default function PremiumLessonViewer() {
  const navigate = useNavigate();
  const { productId, contentId } = useParams<{
    productId: string;
    contentId: string;
  }>();
  
  // RISE V3: useUnifiedAuth em vez de useBuyerAuth
  const { isLoading: authLoading, isAuthenticated } = useUnifiedAuth();

  // React Query declarativo
  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useBuyerProductContent(productId);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [completedContentIds, setCompletedContentIds] = useState<string[]>([]);

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
    // Mark current content as completed
    if (contentId && !completedContentIds.includes(contentId)) {
      setCompletedContentIds((prev) => [...prev, contentId]);
    }
    // TODO: Integrate with progress tracking API
    if (hasNext) {
      goToNext();
    }
  };

  const isCurrentCompleted = contentId 
    ? completedContentIds.includes(contentId) 
    : false;

  // Premium Loading state with animation
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-violet-500/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl"
            />
          </div>
          <p className="text-sm text-muted-foreground">Carregando aula...</p>
        </motion.div>
      </div>
    );
  }

  // Premium Error or not found state
  if (error || !currentContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-red-500/5 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Conteúdo não encontrado
            </h2>
            <p className="text-muted-foreground">
              {error || "Não foi possível carregar esta aula. Tente novamente."}
            </p>
          </div>
          <Link to={`/minha-conta/produto/${productId}`}>
            <Button 
              variant="outline" 
              className="gap-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o Curso
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-500/5 flex flex-col">
      {/* Premium Header */}
      <PremiumHeader
        productId={productId!}
        productName={product?.name || null}
        lessonTitle={currentContent.title}
        moduleName={currentModule?.title || null}
        currentIndex={currentIndex}
        totalLessons={allContents.length}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Main Layout with Premium Sidebar */}
      <LessonLayout
        sidebar={
          <PremiumSidebar
            modules={modules}
            currentModuleId={currentModule?.id || null}
            currentContentId={contentId || null}
            onSelectContent={handleSelectContent}
            completedContentIds={completedContentIds}
            productName={product?.name || undefined}
          />
        }
      >
        <PremiumLessonContent
          content={currentContent}
          contentId={contentId!}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onComplete={handleComplete}
          isCompleted={isCurrentCompleted}
        />
      </LessonLayout>

      {/* Premium Mobile Navigation Sheet */}
      <PremiumMobileSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        modules={modules}
        currentModuleId={currentModule?.id || null}
        currentContentId={contentId || null}
        onSelectContent={handleSelectContent}
        completedContentIds={completedContentIds}
        productName={product?.name || undefined}
      />
    </div>
  );
}
