import { Lock } from "lucide-react";

interface SecurityBadgesProps {
  design: any;
}

export function SecurityBadges({ design }: SecurityBadgesProps) {
  return (
    <div className="space-y-1">
      {/* Security badge */}
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" style={{ color: design.colors.active || '#10b981' }} />
        <span className="text-sm font-medium" style={{ color: design.colors.secondaryText }}>
          Transação Segura e Criptografada
        </span>
      </div>
      
      {/* Description */}
      <p className="text-xs text-center" style={{ color: design.colors.secondaryText, opacity: 0.8 }}>
        Pagamento processado com segurança pela plataforma RiseCheckout
      </p>
    </div>
  );
}
