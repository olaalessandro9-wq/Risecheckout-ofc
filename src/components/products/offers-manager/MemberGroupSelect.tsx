/**
 * Select de Grupo de Membros (reutilizável)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 */

import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MemberGroupOption } from "./types";

interface MemberGroupSelectProps {
  offerId: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  memberGroups: MemberGroupOption[];
}

export function MemberGroupSelect({
  offerId,
  value,
  onChange,
  memberGroups,
}: MemberGroupSelectProps) {
  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <Label htmlFor={`offer-group-${offerId}`} className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        Grupo de Acesso
      </Label>
      <Select
        value={value || "default"}
        onValueChange={(val) => onChange(val === "default" ? null : val)}
      >
        <SelectTrigger id={`offer-group-${offerId}`}>
          <SelectValue placeholder="Grupo padrão do produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            Usar grupo padrão do produto
          </SelectItem>
          {memberGroups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name} {group.is_default && "(Padrão)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Compradores desta oferta serão adicionados automaticamente a este grupo
      </p>
    </div>
  );
}
