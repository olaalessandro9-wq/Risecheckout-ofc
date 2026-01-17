/**
 * AffiliateInviteLink - Seção de link de convite
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface AffiliateInviteLinkProps {
  productId: string;
}

export function AffiliateInviteLink({ productId }: AffiliateInviteLinkProps) {
  const inviteUrl = `https://risecheckout.com/afiliar/${productId}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado!");
  };
  
  const handleOpen = () => {
    window.open(`/afiliar/${productId}`, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-base font-semibold">Link de Convite para Afiliados</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Compartilhe este link para que outras pessoas possam solicitar afiliação
      </p>
      <div className="flex gap-2">
        <Input
          value={inviteUrl}
          readOnly
          className="font-mono text-sm"
        />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleOpen}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
