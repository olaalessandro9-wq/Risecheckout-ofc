/**
 * AuthInput - Standardized input component for auth pages
 * 
 * RISE Protocol V3 - SSOT for auth input styling
 * 
 * This component ENFORCES correct opacity usage for auth theme tokens:
 * - Background: white/5 (glass effect)
 * - Border: white/10 (subtle but visible)
 * - Text: white (legible)
 * - Placeholder: muted gray
 * - Focus: blue accent ring
 * 
 * @module components/auth/ui
 * @version 1.0.0
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Whether the input has an error state */
  hasError?: boolean;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, type, leftIcon, rightIcon, hasError, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--auth-text-muted))] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-12 w-full rounded-lg text-base transition-all duration-200",
            // RISE V3: Correct opacity usage for glass effect
            "bg-[hsl(var(--auth-input-bg)/0.05)]",
            "border border-[hsl(var(--auth-input-border)/0.1)]",
            // Text and placeholder
            "text-[hsl(var(--auth-text-primary))]",
            "placeholder:text-[hsl(var(--auth-input-placeholder))]",
            // Focus states - blue accent with opacity
            "focus:border-[hsl(var(--auth-accent))]",
            "focus:ring-2 focus:ring-[hsl(var(--auth-accent)/0.2)]",
            "focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-[hsl(var(--auth-accent)/0.2)]",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state
            hasError && "border-[hsl(var(--auth-error)/0.5)] focus:border-[hsl(var(--auth-error))] focus:ring-[hsl(var(--auth-error)/0.2)]",
            // Padding adjustments for icons
            leftIcon ? "pl-12" : "pl-4",
            rightIcon ? "pr-12" : "pr-4",
            // Custom classes
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--auth-text-muted))]">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export { AuthInput };
