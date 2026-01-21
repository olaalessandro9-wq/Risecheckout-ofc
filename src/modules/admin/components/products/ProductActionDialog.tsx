/**
 * ProductActionDialog - Dialog de Ação em Produto
 * 
 * Componente puro que exibe o dialog de confirmação de ação em produto.
 * 
 * @version 1.0.0
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProductAction = "activate" | "block" | "delete";

interface ProductActionDialogProps {
  open: boolean;
  productName: string;
  action: ProductAction;
  onConfirm: () => void;
  onCancel: () => void;
}

const ACTION_CONFIG: Record<ProductAction, { title: string; description: string; buttonText: string; destructive: boolean }> = {
  activate: {
    title: "Ativar Produto",
    description: "O produto voltará a ficar disponível para venda.",
    buttonText: "Ativar",
    destructive: false,
  },
  block: {
    title: "Bloquear Produto",
    description: "O produto será bloqueado e não poderá ser vendido até ser reativado.",
    buttonText: "Bloquear",
    destructive: true,
  },
  delete: {
    title: "Remover Produto",
    description: "O produto será marcado como removido. Esta ação pode ser revertida posteriormente.",
    buttonText: "Remover",
    destructive: true,
  },
};

export function ProductActionDialog({
  open,
  productName,
  action,
  onConfirm,
  onCancel,
}: ProductActionDialogProps) {
  const config = ACTION_CONFIG[action];

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a {action === "activate" ? "ativar" : action === "block" ? "bloquear" : "remover"} o produto{" "}
            <strong>"{productName}"</strong>.
            <br />
            <br />
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={config.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
