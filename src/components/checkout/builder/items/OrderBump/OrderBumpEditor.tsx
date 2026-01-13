import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComponentData } from "../../types";
import type { OrderBumpContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface OrderBumpEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<OrderBumpContent>) => void;
  design?: CheckoutDesign;
}

export const OrderBumpEditor = ({ component, onChange }: OrderBumpEditorProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = (component.content || {}) as OrderBumpContent;

  const handleChange = <K extends keyof OrderBumpContent>(field: K, value: OrderBumpContent[K]) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Título da Seção */}
      <div>
        <Label>Título da Seção</Label>
        <Input
          value={content.title || "Ofertas limitadas"}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Ofertas limitadas"
        />
      </div>

      {/* Mostrar Imagens */}
      <div className="flex items-center justify-between">
        <Label>Mostrar Imagens</Label>
        <Switch
          checked={content.showImages !== false}
          onCheckedChange={(checked) => handleChange("showImages", checked)}
        />
      </div>

      {/* Layout */}
      <div>
        <Label>Layout</Label>
        <Select
          value={content.layout || "list"}
          onValueChange={(value) => handleChange("layout", value as "list" | "grid")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="grid">Grade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cor de Destaque */}
      <div>
        <Label>Cor de Destaque (opcional)</Label>
        <Input
          type="color"
          value={content.highlightColor || "#10B981"}
          onChange={(e) => handleChange("highlightColor", e.target.value)}
        />
      </div>

      {/* Cor de Fundo */}
      <div>
        <Label>Cor de Fundo (opcional)</Label>
        <Input
          type="color"
          value={content.backgroundColor || "#F9FAFB"}
          onChange={(e) => handleChange("backgroundColor", e.target.value)}
        />
      </div>
    </div>
  );
};
