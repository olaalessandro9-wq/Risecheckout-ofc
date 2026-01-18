/**
 * useOwnerCheck - Hook para verificar se o usuário é dono do produto
 * 
 * Responsabilidade única: Verificação de propriedade
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UseOwnerCheckParams {
  productId: string | null;
  producerId: string | null;
  isOpen: boolean;
}

interface UseOwnerCheckReturn {
  isOwner: boolean;
  checkingOwner: boolean;
}

export function useOwnerCheck({
  productId,
  producerId,
  isOpen,
}: UseOwnerCheckParams): UseOwnerCheckReturn {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  useEffect(() => {
    if (!productId || !isOpen) {
      setIsOwner(false);
      setCheckingOwner(false);
      return;
    }

    setCheckingOwner(true);
    if (user?.id && producerId === user.id) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
    setCheckingOwner(false);
  }, [productId, producerId, isOpen, user?.id]);

  return {
    isOwner,
    checkingOwner,
  };
}
