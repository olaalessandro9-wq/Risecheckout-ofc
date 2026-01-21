/**
 * UserModerationSection - Seção de ações de moderação
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, UserX, Ban } from "lucide-react";

interface UserModerationSectionProps {
  userStatus: string;
  onActivate: () => void;
  onSuspend: () => void;
  onBan: () => void;
}

export function UserModerationSection({
  userStatus,
  onActivate,
  onSuspend,
  onBan,
}: UserModerationSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Ações de Moderação
      </h3>
      <div className="flex flex-wrap gap-2">
        {userStatus !== "active" && (
          <Button
            size="sm"
            variant="outline"
            className="text-green-500 border-green-500/30"
            onClick={onActivate}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Ativar
          </Button>
        )}
        {userStatus !== "suspended" && (
          <Button
            size="sm"
            variant="outline"
            className="text-amber-500 border-amber-500/30"
            onClick={onSuspend}
          >
            <UserX className="mr-1 h-4 w-4" />
            Suspender
          </Button>
        )}
        {userStatus !== "banned" && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 border-red-500/30"
            onClick={onBan}
          >
            <Ban className="mr-1 h-4 w-4" />
            Banir
          </Button>
        )}
      </div>
    </div>
  );
}
