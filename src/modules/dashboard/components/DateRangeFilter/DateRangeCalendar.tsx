/**
 * DateRangeCalendar Component
 * 
 * @module dashboard/components
 * @version RISE V3 Compliant
 * 
 * Dialog com dois calendários para seleção de período customizado.
 * Zero estado interno - recebe tudo via props.
 */

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContentWithoutClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

interface DateRangeCalendarProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly leftDate: Date | undefined;
  readonly rightDate: Date | undefined;
  readonly leftMonth: Date;
  readonly rightMonth: Date;
  readonly hasError: boolean;
  readonly onLeftDateChange: (date: Date | undefined) => void;
  readonly onRightDateChange: (date: Date | undefined) => void;
  readonly onLeftMonthChange: (date: Date) => void;
  readonly onRightMonthChange: (date: Date) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
}

export function DateRangeCalendar({
  isOpen,
  onOpenChange,
  leftDate,
  rightDate,
  leftMonth,
  rightMonth,
  hasError,
  onLeftDateChange,
  onRightDateChange,
  onLeftMonthChange,
  onRightMonthChange,
  onApply,
  onCancel,
}: DateRangeCalendarProps) {
  const canApply = leftDate && rightDate && !hasError;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContentWithoutClose className="max-w-fit p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Selecionar período personalizado</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 p-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground px-3 font-medium">
              Data inicial
            </span>
            <CalendarComponent
              mode="single"
              selected={leftDate}
              onSelect={onLeftDateChange}
              month={leftMonth}
              onMonthChange={onLeftMonthChange}
              locale={ptBR}
              fixedWeeks
              className="p-3 pointer-events-auto"
            />
          </div>

          <div className="w-px bg-border/60 self-stretch" />

          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground px-3 font-medium">
              Data final
            </span>
            <CalendarComponent
              mode="single"
              selected={rightDate}
              onSelect={onRightDateChange}
              month={rightMonth}
              onMonthChange={onRightMonthChange}
              locale={ptBR}
              fixedWeeks
              className="p-3 pointer-events-auto"
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {hasError && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              A data de início deve ser anterior à data de término.
            </p>
          </div>
        )}

        {/* Footer com botões */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/60 bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            disabled={!canApply}
            className={cn(hasError && "opacity-50 cursor-not-allowed")}
          >
            Aplicar
          </Button>
        </div>
      </DialogContentWithoutClose>
    </Dialog>
  );
}
