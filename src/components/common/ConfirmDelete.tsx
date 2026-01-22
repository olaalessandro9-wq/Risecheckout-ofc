import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

type BaseProps = {
  resourceType: string; // "Produto", "Checkout", etc.
  resourceName: string; // Nome visível pro usuário
  requireTypeToConfirm?: boolean; // se true, exige digitar EXCLUIR
  confirmLabel?: string; // default: "Excluir"
  description?: string; // texto opcional abaixo do título
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
};

type DeclarativeProps = BaseProps & {
  children?: React.ReactNode; // Conteúdo que abre o modal (botão/ícone)
};

export function ConfirmDeleteDialog(props: DeclarativeProps) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [typeWord, setTypeWord] = React.useState("");

  const {
    resourceType,
    resourceName,
    requireTypeToConfirm = false,
    confirmLabel = "Excluir",
    description,
    onConfirm,
    onCancel,
    children,
  } = props;

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
      // Toast é responsabilidade do onConfirm (hook)
    } catch (err: unknown) {
      toast.error(`Falha ao excluir ${resourceType.toLowerCase()}`, {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setBusy(false);
      setTypeWord("");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setTypeWord("");
    onCancel?.();
  };

  const confirmDisabled =
    busy || (requireTypeToConfirm && typeWord.trim().toUpperCase() !== "EXCLUIR");

  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && (v ? setOpen(v) : handleCancel())}>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir {resourceType}?{" "}
            <span className="font-normal">({resourceName})</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? (
              <>
                Essa ação é irreversível e removerá permanentemente o{" "}
                {resourceType.toLowerCase()} selecionado.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireTypeToConfirm && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Para confirmar, digite{" "}
              <span className="font-semibold">EXCLUIR</span>:
            </p>
            <Input
              autoFocus
              value={typeWord}
              onChange={(e) => setTypeWord(e.target.value)}
              placeholder="EXCLUIR"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={handleCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmDisabled}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Uso imperativo em menus/ações */
type ConfirmArgs = {
  resourceType: string;
  resourceName: string;
  requireTypeToConfirm?: boolean;
  confirmLabel?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
};

export function useConfirmDelete() {
  const [state, setState] = React.useState<null | (ConfirmArgs & { open: boolean })>(null);

  const confirm = React.useCallback((args: ConfirmArgs) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...args,
        open: true,
        onConfirm: async () => {
          try {
            await args.onConfirm();
            resolve(true);
          } catch (e) {
            resolve(false);
            throw e; // Re-throw para o toast de erro
          } finally {
            setState(null);
          }
        },
      });
    });
  }, []);

  const Bridge = () => {
    const [busy, setBusy] = React.useState(false);

    if (!state) return null;
    return (
      <AlertDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {state.resourceType}?{" "}
              <span className="font-normal">({state.resourceName})</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {state.description ?? (
                <>
                  Essa ação é irreversível e removerá permanentemente o{" "}
                  {state.resourceType.toLowerCase()} selecionado.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {state.requireTypeToConfirm && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Para confirmar, digite{" "}
                <span className="font-semibold">EXCLUIR</span>:
              </p>
              <Input
                autoFocus
                placeholder="EXCLUIR"
                id="confirm-delete-input"
                disabled={busy}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={busy}
              onClick={() => {
                setState(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={async (e) => {
                e.preventDefault();
                
                if (state.requireTypeToConfirm) {
                  const input = document.getElementById("confirm-delete-input") as HTMLInputElement;
                  if (input?.value.trim().toUpperCase() !== "EXCLUIR") {
                    toast.error("Digite EXCLUIR para confirmar");
                    return;
                  }
                }

                try {
                  setBusy(true);
                  await state.onConfirm();
                  // Toast é responsabilidade do onConfirm (hook)
                } catch (err: unknown) {
                  toast.error(`Falha ao excluir ${state.resourceType.toLowerCase()}`, {
                    description: err instanceof Error ? err.message : "Tente novamente.",
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                state.confirmLabel ?? "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return { confirm, Bridge };
}
