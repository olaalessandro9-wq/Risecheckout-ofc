import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { CheckoutRow, CheckoutCustomization } from "@/types/checkout";
import { ComponentRenderer } from "./ComponentRenderer";

interface RowRendererProps {
  row: CheckoutRow;
  customization: CheckoutCustomization;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  isSelected: boolean;
  onSelectRow: (id: string) => void;
  selectedColumn: number;
  onSelectColumn: (index: number) => void;
  isPreviewMode?: boolean;
}

export const RowRenderer = memo(({
  row,
  customization,
  selectedComponentId,
  onSelectComponent,
  isSelected,
  onSelectRow,
  selectedColumn,
  onSelectColumn,
  isPreviewMode = false,
}: RowRendererProps) => {
  const getColumnClasses = () => {
    switch (row.layout) {
      case "single":
        return "grid-cols-1";
      case "two-columns":
        return "grid-cols-2";
      case "two-columns-asymmetric":
        return "grid-cols-3";
      case "three-columns":
        return "grid-cols-3";
      default:
        return "grid-cols-1";
    }
  };

  const getColumnSpan = (columnIndex: number) => {
    if (row.layout === "two-columns-asymmetric") {
      return columnIndex === 0 ? "col-span-1" : "col-span-2";
    }
    return "col-span-1";
  };

  return (
    <div 
      className={`w-full rounded-lg p-2 transition-all ${
        !isPreviewMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={!isPreviewMode ? (e) => {
        e.stopPropagation();
        onSelectRow(row.id);
      } : undefined}
    >
      <div className={`grid ${getColumnClasses()} gap-4`}>
        {row.columns.map((column, columnIndex) => {
          const dropZoneId = `${row.id}-${columnIndex}`;
          const { setNodeRef, isOver } = useDroppable({ id: dropZoneId });

          return (
            <div
              key={columnIndex}
              ref={setNodeRef}
              className={`${getColumnSpan(columnIndex)} rounded-lg p-4 flex flex-col gap-3 ${
                isPreviewMode 
                  ? 'min-h-0' 
                  : `min-h-[150px] border-2 border-dashed ${isOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'}`
              } ${!isPreviewMode && isSelected && selectedColumn === columnIndex ? 'border-primary' : ''}`}
              onClick={!isPreviewMode ? (e) => {
                e.stopPropagation();
                onSelectRow(row.id);
                onSelectColumn(columnIndex);
              } : undefined}
            >
              {column.length === 0 && !isPreviewMode ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Arraste componentes aqui</span>
                </div>
              ) : (
                column.map((component) => (
                  <ComponentRenderer
                    key={component.id}
                    component={component}
                    customization={customization}
                    isSelected={selectedComponentId === component.id}
                    onClick={() => !isPreviewMode && onSelectComponent(component.id)}
                    isPreviewMode={isPreviewMode}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para otimizar re-renders de rows
  return (
    prevProps.row === nextProps.row &&
    prevProps.selectedComponentId === nextProps.selectedComponentId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectedColumn === nextProps.selectedColumn &&
    prevProps.isPreviewMode === nextProps.isPreviewMode &&
    prevProps.customization.design === nextProps.customization.design
  );
});

RowRenderer.displayName = "RowRenderer";
