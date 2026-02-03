/**
 * PublicComponentRenderer
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Lightweight static renderer for checkout components.
 * ZERO dependencies on @dnd-kit - this is the PUBLIC mode renderer.
 * 
 * Differences from ComponentRenderer (builder):
 * - No drag-and-drop capabilities
 * - No selection state
 * - Pure rendering only
 * - Optimized for production performance
 * 
 * @module checkout-public/components/layout
 */

import React, { memo } from "react";
import CheckoutComponentRenderer from "@/components/checkout/CheckoutComponentRenderer";
import type { ThemePreset } from "@/lib/checkout/themePresets";
import type { CheckoutComponent } from "@/types/checkoutEditor";

interface PublicComponentRendererProps {
  component: CheckoutComponent;
  design: ThemePreset;
}

/**
 * Memoized component renderer for public checkout.
 * 
 * Uses React.memo to prevent unnecessary re-renders.
 * Components are static in public mode - no editing capabilities.
 */
export const PublicComponentRenderer = memo<PublicComponentRendererProps>(
  function PublicComponentRenderer({ component, design }) {
    return (
      <CheckoutComponentRenderer
        component={component}
        design={design}
        isPreviewMode={false}
      />
    );
  }
);

/**
 * Batch renderer for multiple components.
 * Used for top_components and bottom_components arrays.
 */
interface PublicComponentListProps {
  components: CheckoutComponent[];
  design: ThemePreset;
  className?: string;
}

export const PublicComponentList = memo<PublicComponentListProps>(
  function PublicComponentList({ components, design, className }) {
    if (!components || components.length === 0) {
      return null;
    }

    return (
      <div className={className}>
        {components.map((component) => (
          <PublicComponentRenderer
            key={component.id}
            component={component}
            design={design}
          />
        ))}
      </div>
    );
  }
);
