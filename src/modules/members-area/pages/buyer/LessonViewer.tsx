/**
 * LessonViewer Page - Individual Lesson View
 * Displays lesson content with right sidebar navigation (Cakto-style)
 * 
 * RISE V3: Uses useUnifiedAuth (unified identity) + Progress Tracking
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useBuyerProductContent } from "@/hooks/useBuyerOrders";
import { useStudentProgress } from "@/modules/members-area/hooks/useStudentProgress";
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
  
  // RISE V3: useUnifiedAuth em vez de useBuyerAuth
  const { isLoading: authLoading, isAuthenticated, user } = useUnifiedAuth();
  const userId = user?.id;

  // React Query declarativo
  const {
    data,
    isLoading: queryLoading,
    error: queryError,
  } = useBuyerProductContent(productId);

  // Progress tracking
  const { 
    summary, 
    markComplete,
    unmarkComplete,
    fetchSummary,
    isSaving: isCompleting,
  } = useStudentProgress();

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

  // Fetch progress when product loads
  useEffect(() => {
    if (userId && productId && !authLoading && isAuthenticated) {
      fetchSummary(userId, productId);
    }
  }, [userId, productId, authLoading, isAuthenticated, fetchSummary]);

  const isLoading = authLoading || queryLoading;
  const error = queryError ? "Erro ao carregar conteúdo." : null;

  // Derive completed content IDs from summary
  const completedContentIds = useMemo(() => {
    if (!summary?.recent_contents) return [];
    return summary.recent_contents
      .filter(c => c.completed_at)
      .map(c => c.content_id);
  }, [summary]);

  // Check if current content is completed
  const isCurrentContentCompleted = useMemo(() => {
    return completedContentIds.includes(contentId || '');
  }, [completedContentIds, contentId]);

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

  const handleToggleComplete = async () => {
    if (!userId || !contentId || !productId) return;
    
    let success: boolean;
    
    if (isCurrentContentCompleted) {
      // Unmark completion
      success = await unmarkComplete(userId, contentId);
    } else {
      // Mark complete
      success = await markComplete(userId, contentId);
      
      // Navigate to next lesson on completion
      if (success && hasNext) {
        goToNext();
      }
    }
    
    if (success) {
      // Re-fetch to update sidebar progress
      await fetchSummary(userId, productId);
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
            completedContentIds={completedContentIds}
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
          onComplete={handleToggleComplete}
          isCompleting={isCompleting}
          isCompleted={isCurrentContentCompleted}
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
        completedContentIds={completedContentIds}
      />
    </div>
  );
}