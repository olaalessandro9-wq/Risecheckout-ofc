// src/components/checkout/builder/EditorOrderBumps.tsx
import { Zap } from "lucide-react";
import { formatBRL } from "@/lib/formatters/money";
import { ThemePreset } from "@/types/theme";

interface EditorOrderBumpsProps {
  design: ThemePreset;
  orderBumps: any[];
  selectedBumps: Set<string>;
  onToggleBump: (bumpId: string) => void;
}

export const EditorOrderBumps = ({
  design,
  orderBumps,
  selectedBumps,
  onToggleBump,
}: EditorOrderBumpsProps) => {
  if (orderBumps.length === 0) return null;

  return (
    <div className="mt-12 mb-3">
      <h3 
        className="text-base font-bold mb-3 flex items-center gap-2"
        style={{ color: design.colors.primaryText }}
      >
        <Zap 
          className="w-5 h-5"
          style={{ color: design.colors.active }}
        />
        Ofertas limitadas
      </h3>
      
      <div className="space-y-3">
        {orderBumps.map((bump) => (
          <div
            key={bump.id}
            className="rounded-xl overflow-hidden"
            style={{
              border: selectedBumps.has(bump.id)
                ? `2px solid ${design.colors.active}`
                : 'none',
              transition: 'none',
            }}
          >
            {/* Cabeçalho - Call to Action */}
            {bump.call_to_action && (
              <div 
                className="px-3 py-2 flex items-center gap-2"
                style={{ 
                  backgroundColor: selectedBumps.has(bump.id) 
                    ? design.colors.active + "25" 
                    : design.colors.orderBump?.headerBackground || 'rgba(255,255,255,0.15)',
                  transition: 'none'
                }}
              >
                <h5 
                  className="text-xs md:text-sm font-bold uppercase tracking-wide"
                  style={{ color: design.colors.orderBump?.headerText || design.colors.active }}
                >
                  {bump.call_to_action}
                </h5>
                <div className="ml-auto">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: selectedBumps.has(bump.id) 
                        ? design.colors.active 
                        : "rgba(0,0,0,0.2)"
                    }}
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="white" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Conteúdo Principal */}
            <div 
              className="px-4 py-4 cursor-pointer"
              style={{ backgroundColor: design.colors.orderBump?.contentBackground || design.colors.formBackground }}
              onClick={() => onToggleBump(bump.id)}
            >
              <div className="flex items-start gap-3">
                {/* Imagem (condicional) */}
                {bump.image_url && (
                  <img
                    src={bump.image_url}
                    alt={bump.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h5
                    className="font-bold text-sm md:text-base mb-1.5 leading-tight"
                    style={{ color: design.colors.orderBump?.titleText || design.colors.primaryText }}
                  >
                    {bump.name}
                  </h5>
                  
                  {/* Descrição - sempre visível */}
                  {bump.description && (
                    <p
                      className="text-xs md:text-sm mb-2.5 leading-relaxed"
                      style={{ color: design.colors.orderBump?.descriptionText || design.colors.secondaryText }}
                    >
                      {bump.description}
                    </p>
                  )}
                  
                  {/* Preço */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {bump.original_price ? (
                      <>
                        <span 
                          className="text-xs md:text-sm line-through" 
                          style={{ color: design.colors.secondaryText }}
                        >
                          {formatBRL(Number(bump.original_price))}
                        </span>
                        <span 
                          className="text-lg md:text-xl font-bold" 
                          style={{ color: design.colors.orderBump?.priceText || design.colors.active }}
                        >
                          {formatBRL(Number(bump.price))}
                        </span>
                      </>
                    ) : (
                      <span 
                        className="text-lg md:text-xl font-bold" 
                        style={{ color: design.colors.orderBump?.priceText || design.colors.active }}
                      >
                        {formatBRL(Number(bump.price))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rodapé - Adicionar Produto */}
            <div 
              className="px-3 py-2 flex items-center gap-3 cursor-pointer"
              style={{ 
                backgroundColor: selectedBumps.has(bump.id) 
                  ? design.colors.active + "25" 
                  : design.colors.orderBump?.footerBackground || 'rgba(255,255,255,0.15)',
                transition: 'none'
              }}
              onClick={() => onToggleBump(bump.id)}
            >
              <div 
                className="w-5 h-5 rounded border-2 cursor-pointer flex-shrink-0 flex items-center justify-center"
                style={{ 
                  backgroundColor: selectedBumps.has(bump.id) ? design.colors.active : 'transparent',
                  borderColor: selectedBumps.has(bump.id) ? design.colors.active : '#E5E7EB'
                }}
              >
                {selectedBumps.has(bump.id) && (
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="white" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span 
                className="text-sm md:text-base font-semibold"
                style={{ color: design.colors.orderBump?.footerText || design.colors.primaryText }}
              >
                Adicionar Produto
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
