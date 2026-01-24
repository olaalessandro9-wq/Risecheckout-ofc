/**
 * LoadingSwitch - Switch com estados de loading integrados
 * 
 * Componente reutilizável que encapsula o padrão de switch com feedback visual
 * durante operações assíncronas.
 * 
 * @see RISE Protocol V3 - Reusable UI Components
 */

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface LoadingSwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  isLoading?: boolean;
  loadingLabel?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  showLabel?: boolean;
}

const LoadingSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  LoadingSwitchProps
>(
  (
    {
      className,
      isLoading = false,
      checked,
      loadingLabel,
      activeLabel = "Ativo",
      inactiveLabel = "Inativo",
      showLabel = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const displayLabel = isLoading
      ? loadingLabel
      : checked
        ? activeLabel
        : inactiveLabel;

    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <SwitchPrimitives.Root
            className={cn(
              "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all",
              "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isLoading && "cursor-wait opacity-70 animate-pulse",
              className
            )}
            checked={checked}
            disabled={disabled || isLoading}
            {...props}
            ref={ref}
          >
            <SwitchPrimitives.Thumb
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
              )}
            />
          </SwitchPrimitives.Root>
          
          {/* Loading indicator positioned next to switch */}
          {isLoading && (
            <div className="absolute -right-7 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {showLabel && (
          <Label
            className={cn(
              "text-sm min-w-[100px] transition-all cursor-pointer",
              isLoading && "text-primary font-medium",
              (disabled || isLoading) && "cursor-not-allowed opacity-70"
            )}
          >
            {displayLabel}
          </Label>
        )}
      </div>
    );
  }
);

LoadingSwitch.displayName = "LoadingSwitch";

export { LoadingSwitch };
