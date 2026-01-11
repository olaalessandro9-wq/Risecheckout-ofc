/**
 * AffiliateActions Component
 * 
 * Dropdown de ações para cada afiliado.
 */

import { Check, X, Ban, MoreVertical, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type AffiliateStatus = "pending" | "active" | "rejected" | "blocked" | "cancelled";

interface AffiliateActionsProps {
  affiliateId: string;
  status: AffiliateStatus;
  isLoading: boolean;
  onEdit: () => void;
  onAction: (action: "approve" | "reject" | "block" | "unblock") => void;
}

export function AffiliateActions({
  affiliateId,
  status,
  isLoading,
  onEdit,
  onAction,
}: AffiliateActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" /> Editar Comissão
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {status === "pending" && (
          <>
            <DropdownMenuItem onClick={() => onAction("approve")}>
              <Check className="w-4 h-4 mr-2 text-green-600" /> Aprovar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("reject")}>
              <X className="w-4 h-4 mr-2 text-red-600" /> Recusar
            </DropdownMenuItem>
          </>
        )}
        
        {status === "active" && (
          <DropdownMenuItem onClick={() => onAction("block")} className="text-red-600 focus:text-red-600">
            <Ban className="w-4 h-4 mr-2" /> Bloquear Acesso
          </DropdownMenuItem>
        )}
        
        {status === "blocked" && (
          <DropdownMenuItem onClick={() => onAction("unblock")}>
            <Check className="w-4 h-4 mr-2" /> Desbloquear
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
