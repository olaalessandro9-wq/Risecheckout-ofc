/**
 * Testimonial Editor - Editor de Componente Depoimento
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditorComponentProps, TestimonialContent } from "../types";

export function TestimonialEditor({ content, handleChange }: EditorComponentProps<TestimonialContent>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input 
          value={content?.authorName || ""} 
          onChange={(e) => handleChange("authorName", e.target.value)}
          placeholder="Nome do cliente"
        />
      </div>
      <div className="space-y-2">
        <Label>Depoimento</Label>
        <Input 
          value={content?.testimonialText || ""} 
          onChange={(e) => handleChange("testimonialText", e.target.value)}
          placeholder="Texto do depoimento"
        />
      </div>
      <div className="space-y-2">
        <Label>Foto (URL)</Label>
        <Input 
          value={content?.authorImage || ""} 
          onChange={(e) => handleChange("authorImage", e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
