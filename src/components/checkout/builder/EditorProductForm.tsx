// src/components/checkout/builder/EditorProductForm.tsx
import { User } from "lucide-react";
import { ThemePreset } from "@/types/theme";
import { ProductHeader } from "@/components/checkout/ui";

interface EditorProductFormProps {
  design: ThemePreset;
  productData?: any;
}

export const EditorProductForm = ({ design, productData }: EditorProductFormProps) => {
  return (
    <div 
      className="rounded-xl p-5 mb-4"
      style={{ backgroundColor: design.colors.formBackground || "#FFFFFF" }}
    >
      {/* Product Header - Componente Reutilizável */}
      <ProductHeader
        name={productData?.name}
        price={productData?.price}
        imageUrl={productData?.image_url}
        design={design}
        className="mb-5"
      />

      {/* Divider */}
      <div className="border-t border-gray-200 my-5"></div>

      {/* Customer Data Form */}
      <div className="space-y-3">
        <h2 
          className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight"
          style={{ color: design.colors.primaryText || "#000000" }}
        >
          <User className="w-5 h-5" />
          Dados necessários para envio do seu acesso:
        </h2>
        
        <div className="space-y-3 personal-data-fields-container">
          <div>
            <label 
              className="text-sm mb-1 block"
              style={{ color: design.colors.secondaryText || "#374151" }}
            >
              Nome completo
            </label>
            <input
              type="text"
              placeholder="Digite seu nome completo"
              className="personal-data-field"
              style={{
                '--field-bg-color': design.colors.personalDataFields?.backgroundColor || "#FFFFFF",
                '--field-text-color': design.colors.personalDataFields?.textColor || "#000000",
                '--field-border-color': design.colors.personalDataFields?.borderColor || "#D1D5DB",
                '--field-placeholder-color': design.colors.personalDataFields?.placeholderColor || "#6B7280",
                '--field-focus-border-color': design.colors.personalDataFields?.focusBorderColor || "#10B981",
              } as React.CSSProperties}
            />
          </div>
          
          <div>
            <label 
              className="text-sm mb-1 block"
              style={{ color: design.colors.secondaryText || "#374151" }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="Digite seu email"
              className="personal-data-field"
              style={{
                '--field-bg-color': design.colors.personalDataFields?.backgroundColor || "#FFFFFF",
                '--field-text-color': design.colors.personalDataFields?.textColor || "#000000",
                '--field-border-color': design.colors.personalDataFields?.borderColor || "#D1D5DB",
                '--field-placeholder-color': design.colors.personalDataFields?.placeholderColor || "#6B7280",
                '--field-focus-border-color': design.colors.personalDataFields?.focusBorderColor || "#10B981",
              } as React.CSSProperties}
            />
          </div>

          {productData?.required_fields?.cpf && (
            <div>
              <label 
                className="text-sm mb-1 block"
                style={{ color: design.colors.secondaryText || "#374151" }}
              >
                CPF/CNPJ
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                className="personal-data-field"
                style={{
                  '--field-bg-color': design.colors.personalDataFields?.backgroundColor || "#FFFFFF",
                  '--field-text-color': design.colors.personalDataFields?.textColor || "#000000",
                  '--field-border-color': design.colors.personalDataFields?.borderColor || "#D1D5DB",
                  '--field-placeholder-color': design.colors.personalDataFields?.placeholderColor || "#6B7280",
                  '--field-focus-border-color': design.colors.personalDataFields?.focusBorderColor || "#10B981",
                } as React.CSSProperties}
              />
            </div>
          )}

          {productData?.required_fields?.phone && (
            <div>
              <label 
                className="text-sm mb-1 block"
                style={{ color: design.colors.secondaryText || "#374151" }}
              >
                Celular
              </label>
              <input
                type="tel"
                placeholder="+55 (00) 00000-0000"
                className="personal-data-field"
                style={{
                  '--field-bg-color': design.colors.personalDataFields?.backgroundColor || "#FFFFFF",
                  '--field-text-color': design.colors.personalDataFields?.textColor || "#000000",
                  '--field-border-color': design.colors.personalDataFields?.borderColor || "#D1D5DB",
                  '--field-placeholder-color': design.colors.personalDataFields?.placeholderColor || "#6B7280",
                  '--field-focus-border-color': design.colors.personalDataFields?.focusBorderColor || "#10B981",
                } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
