/**
 * CheckoutPublicLayout
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Lightweight layout component for PUBLIC checkout pages.
 * 
 * CRITICAL: This component has ZERO dependencies on @dnd-kit.
 * This is intentional to reduce bundle size for the public checkout.
 * 
 * Key differences from CheckoutMasterLayout:
 * - No useDroppable hooks (from @dnd-kit/core)
 * - No editor mode logic
 * - No drag-and-drop zones
 * - Pure rendering for maximum performance
 * 
 * This saves ~50KB+ from the public checkout bundle.
 * 
 * @module checkout-public/components/layout
 */

import React, { memo, useMemo } from "react";
import { PublicComponentList } from "./PublicComponentRenderer";
import type { ThemePreset } from "@/lib/checkout/themePresets";
import type { CheckoutComponent } from "@/types/checkoutEditor";

// ============================================================================
// TYPES
// ============================================================================

interface BackgroundImageConfig {
  url?: string;
  fixed?: boolean;
  repeat?: boolean;
  expand?: boolean;
}

interface CheckoutPublicCustomization {
  topComponents?: CheckoutComponent[];
  bottomComponents?: CheckoutComponent[];
  backgroundImage?: BackgroundImageConfig;
}

interface CheckoutPublicLayoutProps {
  design: ThemePreset;
  customization?: CheckoutPublicCustomization;
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Pure layout component for public checkout pages.
 * 
 * Renders:
 * 1. Top components (images, timers, testimonials, etc.)
 * 2. Main checkout content (forms, payment methods, etc.)
 * 3. Bottom components (guarantees, seals, etc.)
 * 
 * All rendering is static - no editing capabilities.
 */
export const CheckoutPublicLayout = memo<CheckoutPublicLayoutProps>(
  function CheckoutPublicLayout({ design, customization, children }) {
    // =========================================================================
    // MEMOIZED VALUES
    // =========================================================================
    
    const hasTopComponents = customization?.topComponents && customization.topComponents.length > 0;
    const hasBottomComponents = customization?.bottomComponents && customization.bottomComponents.length > 0;
    
    // Background style computation
    const backgroundStyle = useMemo(() => {
      const style: React.CSSProperties = {
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: design.colors.background,
      };
      
      // Apply background image if configured
      const bgImage = customization?.backgroundImage;
      if (bgImage?.url) {
        style.backgroundImage = `url(${bgImage.url})`;
        style.backgroundRepeat = bgImage.repeat ? 'repeat' : 'no-repeat';
        style.backgroundPosition = 'center';
        style.backgroundSize = bgImage.expand ? 'cover' : 'auto';
        style.backgroundAttachment = bgImage.fixed ? 'fixed' : 'scroll';
      }
      
      return style;
    }, [design.colors.background, customization?.backgroundImage]);

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
      <div className="min-h-screen py-4 px-2 md:py-8 md:px-4" style={backgroundStyle}>
        <div className="max-w-7xl mx-auto">
          {/* Top Components (static render) */}
          {hasTopComponents && (
            <PublicComponentList
              components={customization!.topComponents!}
              design={design}
              className="mb-4 md:mb-6"
            />
          )}

          {/* Main Checkout Content */}
          {children}

          {/* Bottom Components (static render) */}
          {hasBottomComponents && (
            <PublicComponentList
              components={customization!.bottomComponents!}
              design={design}
              className="mt-4 md:mt-6"
            />
          )}
        </div>
      </div>
    );
  }
);
