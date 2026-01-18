/**
 * OwnerActions - Ações para o Produtor (Dono do Produto)
 * 
 * Responsabilidade única: Botões de ação para o produtor
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Users } from "lucide-react";

interface OwnerActionsProps {
  productId: string;
  onClose: () => void;
}

export function OwnerActions({ productId, onClose }: OwnerActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => {
          onClose();
          navigate(`/dashboard/produtos/editar?id=${productId}`);
        }}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        <Pencil className="w-4 h-4" />
        Editar Produto
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          onClose();
          navigate(`/dashboard/afiliados`);
        }}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        <Users className="w-4 h-4" />
        Ver Afiliados
      </Button>
    </div>
  );
}
