import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentData } from "../../types";
import type { TestimonialContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";

interface TestimonialEditorProps {
  component: ComponentData;
  onChange: (newContent: Partial<TestimonialContent>) => void;
  design?: CheckoutDesign;
}

export const TestimonialEditor = ({ component, onChange }: TestimonialEditorProps) => {
  // Type assertion segura - o componente só recebe content do tipo correto via registry
  const content = (component.content || {}) as TestimonialContent;

  const handleChange = <K extends keyof TestimonialContent>(field: K, value: TestimonialContent[K]) => {
    onChange({
      ...content,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Texto do Depoimento */}
      <div>
        <Label>Texto do Depoimento</Label>
        <Input
          value={content.testimonialText || ""}
          onChange={(e) => handleChange("testimonialText", e.target.value)}
          placeholder="Depoimento do cliente"
        />
      </div>

      {/* Nome do Autor */}
      <div>
        <Label>Nome do Autor</Label>
        <Input
          value={content.authorName || ""}
          onChange={(e) => handleChange("authorName", e.target.value)}
          placeholder="Nome do Cliente"
        />
      </div>

      {/* Foto do Autor */}
      <div>
        <Label>Foto do Autor (URL)</Label>
        <Input
          value={content.authorImage || ""}
          onChange={(e) => handleChange("authorImage", e.target.value)}
          placeholder="https://exemplo.com/foto.jpg"
        />
      </div>
    </div>
  );
};
