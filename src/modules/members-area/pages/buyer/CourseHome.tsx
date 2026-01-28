/**
 * CourseHome Page - Dynamic Sections from Builder
 * Renders banner sections and module carousels based on Builder configuration
 * With sidebar (desktop) and bottom nav (mobile) from Builder settings
 * 
 * RISE V3: 
 * - Uses useUnifiedAuth (unified identity)
 * - Passes viewport to filter sections
 * - Passes cardSize to ModuleCarousel
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useBuyerProductContent } from "@/hooks/useBuyerOrders";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import { HeroBanner, ModuleCarousel } from "./components/netflix";
import { BuyerBannerSection } from "./components/sections/BuyerBannerSection";
import { BuyerSidebar } from "./components/layout/BuyerSidebar";
import { BuyerMobileNav } from "./components/layout/BuyerMobileNav";
import { MembersAreaThemeProvider } from "./components/MembersAreaThemeProvider";
import type { Module, ContentItem, ProductData } from "./components/types";
import { 
  DEFAULT_BUILDER_SETTINGS, 
  type MembersAreaBuilderSettings,
  type ModulesSettings,
} from "@/modules/members-area-builder/types/builder.types";
import type { CardSize } from "@/modules/members-area-builder/constants/cardSizes";
import type { TitleSize } from "@/modules/members-area-builder/constants/titleSizes";

// Helper to filter and order modules based on section settings
function getVisibleOrderedModules(
  allModules: Module[], 
  settings: { hidden_module_ids?: string[]; module_order?: string[] }
): Module[] {
  const hiddenIds = settings.hidden_module_ids || [];
  const orderIds = settings.module_order || [];
  
  // Filter hidden modules
  const visibleModules = allModules.filter(m => !hiddenIds.includes(m.id));
  
  // Apply custom order if exists
  if (orderIds.length === 0) return visibleModules;
  
  const moduleMap = new Map(visibleModules.map(m => [m.id, m]));
  const ordered: Module[] = [];
  
  for (const id of orderIds) {
    const module = moduleMap.get(id);
    if (module) {
      ordered.push(module);
      moduleMap.delete(id);
    }
  }
  
  // Add remaining unordered modules
  for (const module of moduleMap.values()) {
    ordered.push(module);
  }
  
  return ordered;
}

interface BuilderSection {
  id: string;
  product_id: string;
  type: string;
  title: string | null;
  position: number;
  settings: Record<string, unknown>;
  is_active: boolean;
}

export default function CourseHome() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  // RISE V3: useUnifiedAuth em vez de useBuyerAuth
  const { isLoading: authLoading, isAuthenticated } = useUnifiedAuth();
  // RISE V3: Detect viewport for filtering sections
  const isMobile = useIsMobile();
  const viewport = isMobile ? 'mobile' : 'desktop';
  
  // React Query declarativo - RISE V3: Pass viewport to filter sections
  const { data, isLoading: queryLoading, error: queryError } = useBuyerProductContent(productId, viewport);

  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  // Derived state from query data
  const product = data?.product as ProductData | null;
  const modules = (data?.modules as Module[]) || [];
  const sections = (data?.sections as BuilderSection[]) || [];
  
  const membersAreaSettings = useMemo(() => {
    if (product?.settings && typeof product.settings === 'object') {
      return {
        ...DEFAULT_BUILDER_SETTINGS,
        ...(product.settings as Partial<MembersAreaBuilderSettings>),
      };
    }
    return DEFAULT_BUILDER_SETTINGS;
  }, [product?.settings]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = authLoading || queryLoading;
  const error = queryError ? "Erro ao carregar conteúdo." : null;

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

  // Check if we have Builder sections configured
  const hasBuilderSections = sections.length > 0;

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
    <MembersAreaThemeProvider settings={membersAreaSettings}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <BuyerSidebar
          settings={membersAreaSettings}
          isCollapsed={isMenuCollapsed}
          onToggleCollapse={() => setIsMenuCollapsed(!isMenuCollapsed)}
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-x-hidden",
          membersAreaSettings.show_menu_mobile !== false ? "pb-16 lg:pb-0" : "pb-0"
        )}>
          {/* Back Button - Floating */}
          <div className="absolute top-4 left-4 z-30 lg:hidden">
            <Link to="/minha-conta/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Render sections based on Builder configuration */}
          {hasBuilderSections ? (
            // Use Builder sections
            <div className="space-y-2">
              {sections.map((section) => {
                if (section.type === 'banner') {
                  const bannerSettings = section.settings as {
                    type: 'banner';
                    slides: Array<{ id: string; image_url: string; link?: string; alt?: string }>;
                    transition_seconds: number;
                    height: 'small' | 'medium' | 'large';
                    show_navigation: boolean;
                    show_indicators: boolean;
                  };
                  
                  // Only render if has slides
                  if (!bannerSettings.slides || bannerSettings.slides.length === 0) {
                    return null;
                  }
                  
                  return (
                    <BuyerBannerSection
                      key={section.id}
                      settings={bannerSettings}
                      title={section.title}
                    />
                  );
                }
                
                if (section.type === 'modules') {
                  // Apply hidden_module_ids and module_order filters
                  const sectionSettings = section.settings as unknown as ModulesSettings;
                  const visibleModules = getVisibleOrderedModules(modules, sectionSettings);
                  
                  // RISE V3: Get all display settings from section
                  const cardSize: CardSize = sectionSettings.card_size || 'medium';
                  const titleSize: TitleSize = sectionSettings.title_size || 'medium';
                  const showTitle = sectionSettings.show_title || 'always';
                  
                  // Don't render section if no visible modules
                  if (visibleModules.length === 0) return null;
                  
                  return (
                    <ModuleCarousel
                      key={section.id}
                      modules={visibleModules}
                      onSelectContent={handleSelectContent}
                      title={section.title}
                      cardSize={cardSize}
                      titleSize={titleSize}
                      showTitle={showTitle}
                    />
                  );
                }
                
                return null;
              })}
            </div>
          ) : (
            // Fallback to default layout if no Builder sections
            <>
              <HeroBanner
                product={product}
                modules={modules}
                onStartCourse={handleStartCourse}
              />
              <ModuleCarousel
                modules={modules}
                onSelectContent={handleSelectContent}
              />
            </>
          )}

          {/* Spacer for bottom */}
          <div className="h-16 lg:h-8" />
        </main>

        {/* Mobile Bottom Nav */}
        <BuyerMobileNav settings={membersAreaSettings} />
      </div>
    </MembersAreaThemeProvider>
  );
}
