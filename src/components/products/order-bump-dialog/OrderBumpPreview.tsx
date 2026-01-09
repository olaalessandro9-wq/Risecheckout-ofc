import { useState } from "react";
import { Gift } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { OrderBumpProduct } from "./types";

interface OrderBumpPreviewProps {
  selectedProduct: OrderBumpProduct | undefined;
  customTitle: string;
  customDescription: string;
  callToAction: string;
  showImage: boolean;
  discountEnabled: boolean;
  originalPrice: number;
  finalPrice: number;
  discountPercentage: number;
}

export function OrderBumpPreview({
  selectedProduct,
  customTitle,
  customDescription,
  callToAction,
  showImage,
  discountEnabled,
  originalPrice,
  finalPrice,
  discountPercentage,
}: OrderBumpPreviewProps) {
  const [previewSelected, setPreviewSelected] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-foreground">Preview (clique para ver selecionado)</Label>
      <div
        className="bg-background border border-border rounded-lg overflow-hidden cursor-pointer transition-all"
        onClick={() => setPreviewSelected(!previewSelected)}
      >
        {selectedProduct ? (
          <>
            {/* Header - Call to Action */}
            <div
              className={
                previewSelected
                  ? "bg-primary/20 px-3 py-2 flex items-center justify-between"
                  : "bg-muted/80 px-3 py-2 flex items-center justify-between"
              }
            >
              <span className="text-xs font-semibold text-primary uppercase">{callToAction}</span>
              <div
                className={
                  previewSelected
                    ? "w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                    : "w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                }
              >
                <svg
                  className={
                    previewSelected
                      ? "w-3 h-3 text-primary-foreground"
                      : "w-3 h-3 text-muted-foreground"
                  }
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-3 py-2.5 space-y-1.5">
              <div className="flex gap-3">
                {/* Image (conditional) */}
                {showImage && selectedProduct.image_url && (
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={selectedProduct.image_url}
                      alt={customTitle || selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-sm font-semibold text-foreground leading-tight break-words">
                    {customTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                    {customDescription}
                  </p>

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    {discountEnabled && discountPercentage > 0 ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatBRL(originalPrice)}
                        </span>
                        <span className="text-base font-bold text-primary">
                          {formatBRL(finalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-primary">
                        {formatBRL(finalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Add Checkbox */}
            <div className={previewSelected ? "bg-primary/20 px-3 py-2" : "bg-muted/80 px-3 py-2"}>
              <div className="flex items-center gap-2">
                <div
                  className={
                    previewSelected
                      ? "w-4 h-4 border-2 border-primary rounded bg-primary flex items-center justify-center"
                      : "w-4 h-4 border-2 border-border rounded bg-background"
                  }
                >
                  {previewSelected && (
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-foreground">Adicionar Produto</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Selecione um produto para ver o preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
