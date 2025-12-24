import { ComponentData } from "../../types";
import { useCheckoutData } from "@/contexts/CheckoutDataContext";
import { Zap } from "lucide-react";

interface OrderBumpViewProps {
  component: ComponentData;
  design?: any;
  isPreviewMode?: boolean;
}

export const OrderBumpView = ({ component, design, isPreviewMode = false }: OrderBumpViewProps) => {
  const { content } = component;
  
  // Tenta acessar os dados reais do Context (se disponível)
  let orderBumps: any[] = [];
  try {
    const checkoutData = useCheckoutData();
    orderBumps = checkoutData.orderBumps || [];
  } catch {
    // Context não disponível (estamos no editor)
    orderBumps = [];
  }

  // Se estamos no editor ou não há bumps reais, mostra placeholder
  if (isPreviewMode || orderBumps.length === 0) {
    return (
      <div 
        className="rounded-xl border-2 border-dashed p-4"
        style={{
          borderColor: content?.highlightColor || design?.colors?.active || "#10B981",
          backgroundColor: content?.backgroundColor || design?.colors?.formBackground || "#F9FAFB",
        }}
      >
        <h3 
          className="font-bold mb-4 flex items-center gap-2"
          style={{ color: design?.colors?.primaryText || "#000000" }}
        >
          <Zap 
            className="w-5 h-5"
            style={{ color: content?.highlightColor || design?.colors?.active || "#10B981" }}
          />
          {content?.title || "Ofertas limitadas"}
        </h3>
        
        <div className="space-y-3 opacity-70">
          {/* Placeholder de um bump */}
          <div 
            className="h-20 rounded-lg border flex items-center p-3 gap-3"
            style={{ 
              backgroundColor: "#FFFFFF",
              borderColor: design?.colors?.active || "#10B981",
            }}
          >
            {content?.showImages !== false && (
              <div className="w-16 h-16 bg-gray-200 rounded" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-20 bg-green-100 rounded" />
          </div>
        </div>
        
        <p className="text-xs text-center mt-2 text-muted-foreground">
          (Seus Order Bumps reais aparecerão aqui no checkout público)
        </p>
      </div>
    );
  }

  // Renderização real dos bumps (quando há dados do Context)
  return (
    <div 
      className="rounded-xl p-4"
      style={{
        backgroundColor: content?.backgroundColor || design?.colors?.formBackground || "#F9FAFB",
      }}
    >
      <h3 
        className="font-bold mb-4 flex items-center gap-2"
        style={{ color: design?.colors?.primaryText || "#000000" }}
      >
        <Zap 
          className="w-5 h-5"
          style={{ color: content?.highlightColor || design?.colors?.active || "#10B981" }}
        />
        {content?.title || "Ofertas limitadas"}
      </h3>
      
      <div className={content?.layout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
        {orderBumps.map((bump: any) => (
          <div
            key={bump.id}
            className="rounded-xl overflow-hidden border"
            style={{
              borderColor: content?.highlightColor || design?.colors?.active || "#10B981",
            }}
          >
            {/* Cabeçalho */}
            {bump.call_to_action && (
              <div 
                className="px-3 py-2"
                style={{ 
                  backgroundColor: (content?.highlightColor || design?.colors?.active || "#10B981") + "25",
                }}
              >
                <h5 
                  className="text-xs md:text-sm font-bold uppercase tracking-wide"
                  style={{ color: content?.highlightColor || design?.colors?.active || "#10B981" }}
                >
                  {bump.call_to_action}
                </h5>
              </div>
            )}
            
            {/* Conteúdo */}
            <div 
              className="px-4 py-4"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-start gap-3">
                {content?.showImages !== false && bump.image_url && (
                  <img
                    src={bump.image_url}
                    alt={bump.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h5
                    className="font-bold text-sm md:text-base mb-1.5 leading-tight"
                    style={{ color: design?.colors?.primaryText || "#000000" }}
                  >
                    {bump.name}
                  </h5>
                  
                  {bump.description && (
                    <p
                      className="text-xs md:text-sm mb-2.5 leading-relaxed"
                      style={{ color: design?.colors?.secondaryText || "#6B7280" }}
                    >
                      {bump.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {bump.original_price && (
                      <span 
                        className="text-xs md:text-sm line-through" 
                        style={{ color: design?.colors?.secondaryText || "#6B7280" }}
                      >
                        R$ {Number(bump.original_price).toFixed(2)}
                      </span>
                    )}
                    <span 
                      className="text-lg md:text-xl font-bold" 
                      style={{ color: content?.highlightColor || design?.colors?.active || "#10B981" }}
                    >
                      R$ {Number(bump.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
