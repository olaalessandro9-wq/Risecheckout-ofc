/**
 * RiseLogo - Single Source of Truth for the RiseCheckout logo
 * 
 * RISE ARCHITECT PROTOCOL V3 - Atomic SSOT component
 * 
 * All logo instances across the app must use this component.
 * To change the logo, update only this file.
 * 
 * @module brand
 * @version 1.0.0
 */

import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo.jpeg";

// ============================================================================
// TYPES
// ============================================================================

interface RiseLogoProps {
  /** sm = 32px (mobile), md = 40px (desktop/sidebar) */
  size?: "sm" | "md";
  /** default = bg-primary (dashboard), auth = gradient (auth pages) */
  variant?: "default" | "auth";
  /** Additional classes for the outer container */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-10 h-10 rounded-xl",
} as const;

const VARIANT_MAP = {
  default: "bg-primary shadow-sm",
  auth: "bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-secondary))] shadow-lg shadow-[hsl(var(--auth-accent)/0.3)]",
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function RiseLogo({ size = "md", variant = "default", className }: RiseLogoProps) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center overflow-hidden",
        SIZE_MAP[size],
        VARIANT_MAP[variant],
        className,
      )}
    >
      <img
        src={logoSrc}
        alt="RiseCheckout"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
