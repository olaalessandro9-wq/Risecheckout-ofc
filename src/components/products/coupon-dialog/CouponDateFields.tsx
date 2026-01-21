/**
 * CouponDateFields Component
 * 
 * Renders expiration toggle and date range pickers.
 * 
 * @module coupon-dialog
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { Controller } from "react-hook-form";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CouponDateFieldsProps } from "./types";

export function CouponDateFields({ form }: CouponDateFieldsProps) {
  const { control, watch, formState: { errors } } = form;
  const hasExpiration = watch("hasExpiration");
  const startDate = watch("startDate");

  return (
    <div className="space-y-4">
      {/* Switch de expiração */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg">
        <Label htmlFor="hasExpiration" className="text-foreground font-medium cursor-pointer">
          Tem expiração
        </Label>
        <Controller
          name="hasExpiration"
          control={control}
          render={({ field }) => (
            <Switch
              id="hasExpiration"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Datas (condicional) */}
      {hasExpiration && (
        <div className="grid grid-cols-2 gap-4">
          {/* Data início */}
          <div className="space-y-2">
            <Label className="text-foreground">Início</Label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !field.value && "text-muted-foreground",
                        errors.startDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          {/* Data fim */}
          <div className="space-y-2">
            <Label className="text-foreground">Fim</Label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border",
                        !field.value && "text-muted-foreground",
                        errors.endDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.endDate && (
              <p className="text-xs text-destructive">{errors.endDate.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
