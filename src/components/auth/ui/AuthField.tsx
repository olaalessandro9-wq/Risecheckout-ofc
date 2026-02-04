/**
 * AuthField - Complete field component (Label + Input + Error)
 * 
 * RISE Protocol V3 - SSOT for auth form fields
 * 
 * Combines:
 * - Label with correct auth theming
 * - AuthInput with proper glass effect
 * - Error message display
 * - Consistent spacing
 * 
 * @module components/auth/ui
 * @version 1.0.0
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { AuthInput, type AuthInputProps } from "./AuthInput";
import { cn } from "@/lib/utils";

export interface AuthFieldProps extends AuthInputProps {
  /** Label text */
  label: string;
  /** Error message to display */
  error?: string;
  /** Additional container className */
  containerClassName?: string;
  /** Label className override */
  labelClassName?: string;
}

const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      label,
      error,
      containerClassName,
      labelClassName,
      id,
      ...inputProps
    },
    ref
  ) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("space-y-2", containerClassName)}>
        <Label
          htmlFor={inputId}
          className={cn(
            "text-[hsl(var(--auth-text-primary))] font-medium",
            labelClassName
          )}
        >
          {label}
        </Label>
        <AuthInput
          id={inputId}
          ref={ref}
          hasError={!!error}
          {...inputProps}
        />
        {error && (
          <p className="text-sm text-[hsl(var(--auth-error))] mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthField.displayName = "AuthField";

export { AuthField };
