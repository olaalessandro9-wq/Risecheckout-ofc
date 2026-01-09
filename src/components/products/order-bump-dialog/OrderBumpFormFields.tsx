import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { parseBRLInput } from "@/lib/money";
import { NormalizedOffer } from "@/services/offers";
import { OrderBumpProduct, OrderBumpFormData } from "./types";

interface OrderBumpFormFieldsProps {
  formData: OrderBumpFormData;
  products: OrderBumpProduct[];
  offers: NormalizedOffer[];
  loadingProducts: boolean;
  selectedProduct: OrderBumpProduct | undefined;
  selectedOffer: NormalizedOffer | undefined;
  discountPercentage: number;
  onFieldChange: <K extends keyof OrderBumpFormData>(field: K, value: OrderBumpFormData[K]) => void;
}

function formatCurrency(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (!numbers) return "0,00";
  const amount = parseInt(numbers) / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OrderBumpFormFields({
  formData,
  products,
  offers,
  loadingProducts,
  selectedProduct,
  selectedOffer,
  discountPercentage,
  onFieldChange,
}: OrderBumpFormFieldsProps) {
  const handleDiscountPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    onFieldChange("discountPrice", formatted);
  };

  const isDiscountInvalid =
    formData.discountEnabled &&
    parseBRLInput(formData.discountPrice) <= (selectedOffer?.price || selectedProduct?.price || 0);

  return (
    <div className="space-y-3">
      {/* Product Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="produto" className="text-foreground">
          Produto *
        </Label>
        {loadingProducts ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Select
            value={formData.selectedProductId}
            onValueChange={(value) => onFieldChange("selectedProductId", value)}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {products.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Nenhum produto disponível
                </div>
              ) : (
                products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
        <p className="text-[11px] text-muted-foreground leading-tight">
          Selecione o produto que será oferecido como order bump
        </p>
      </div>

      {/* Offer Selection */}
      <div className="space-y-1.5">
        <Label htmlFor="oferta" className="text-foreground">
          Oferta *
        </Label>
        <Select
          value={formData.selectedOfferId}
          onValueChange={(value) => onFieldChange("selectedOfferId", value)}
          disabled={!formData.selectedProductId || offers.length === 0}
        >
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue placeholder="Selecione uma oferta" />
          </SelectTrigger>
          <SelectContent>
            {offers.map((offer) => (
              <SelectItem key={offer.id} value={offer.id}>
                {offer.product_name ?? selectedProduct?.name} - {formatBRL(offer.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground leading-tight">
          A primeira oferta do produto é selecionada automaticamente
        </p>
      </div>

      {/* Discount Checkbox */}
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="discount"
          checked={formData.discountEnabled}
          onCheckedChange={(checked) => onFieldChange("discountEnabled", checked as boolean)}
        />
        <Label htmlFor="discount" className="text-foreground cursor-pointer">
          Aplicar desconto
        </Label>
      </div>

      {/* Discount Price (conditional) */}
      {formData.discountEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="discountPrice" className="text-foreground">
            Preço de origem
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="discountPrice"
              value={formData.discountPrice}
              onChange={handleDiscountPriceChange}
              className={`pl-10 bg-background text-foreground ${
                isDiscountInvalid ? "border-red-500" : "border-border"
              }`}
              placeholder="0,00"
            />
          </div>
          {isDiscountInvalid ? (
            <p className="text-xs text-red-500">Valor deve ser maior que a oferta</p>
          ) : (
            <p className="text-xs text-primary">
              {discountPercentage > 0 && `Desconto de aproximadamente ${discountPercentage}%`}
            </p>
          )}
        </div>
      )}

      {/* Call to Action */}
      <div className="space-y-1.5">
        <Label htmlFor="callToAction" className="text-foreground">
          Call to Action
        </Label>
        <Input
          id="callToAction"
          value={formData.callToAction}
          onChange={(e) => onFieldChange("callToAction", e.target.value)}
          className="bg-background border-border text-foreground"
          placeholder="SIM, EU ACEITO ESSA OFERTA ESPECIAL!"
        />
        <p className="text-[11px] text-muted-foreground leading-tight">
          Texto que aparece no topo do order bump
        </p>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="customTitle" className="text-foreground">
          Título
        </Label>
        <Input
          id="customTitle"
          value={formData.customTitle}
          onChange={(e) => onFieldChange("customTitle", e.target.value)}
          className="bg-background border-border text-foreground"
          placeholder="Nome do seu produto"
        />
        <p className="text-[11px] text-muted-foreground leading-tight">
          Nome que aparece no order bump (padrão: nome do produto)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="customDescription" className="text-foreground">
          Descrição
        </Label>
        <Input
          id="customDescription"
          value={formData.customDescription}
          onChange={(e) => onFieldChange("customDescription", e.target.value)}
          className="bg-background border-border text-foreground"
          placeholder="Adicione a compra"
        />
        <p className="text-[11px] text-muted-foreground leading-tight">
          Texto descritivo do order bump
        </p>
      </div>

      {/* Show Image Checkbox */}
      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="showImage"
          checked={formData.showImage}
          onCheckedChange={(checked) => onFieldChange("showImage", checked as boolean)}
        />
        <Label htmlFor="showImage" className="text-foreground cursor-pointer">
          Exibir imagem do produto
        </Label>
      </div>
    </div>
  );
}
