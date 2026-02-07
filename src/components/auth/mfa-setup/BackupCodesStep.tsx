/**
 * MFA Setup - Backup Codes Step
 * 
 * Displays one-time backup codes after MFA activation.
 * Provides copy-to-clipboard and download-as-file functionality.
 * Requires explicit confirmation before allowing dialog closure.
 * 
 * @module components/auth/mfa-setup/BackupCodesStep
 * @version 1.0.0
 */

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface BackupCodesStepProps {
  backupCodes: string[];
  savedBackupCodes: boolean;
  onSavedChange: (checked: boolean) => void;
  onComplete: () => void;
}

export function BackupCodesStep({
  backupCodes,
  savedBackupCodes,
  onSavedChange,
  onComplete,
}: BackupCodesStepProps) {
  const handleCopy = useCallback(() => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Códigos copiados!");
  }, [backupCodes]);

  const handleDownload = useCallback(() => {
    const text = [
      "RiseCheckout - Códigos de Backup MFA",
      "=====================================",
      "Guarde estes códigos em um lugar seguro.",
      "Cada código só pode ser usado uma vez.",
      "",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "risecheckout-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo baixado!");
  }, [backupCodes]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
        <p className="text-sm font-medium text-foreground">
          MFA ativado com sucesso!
        </p>
        <p className="text-sm text-muted-foreground">
          Salve estes códigos de backup em um local seguro. Cada código
          só pode ser usado uma vez.
        </p>
      </div>

      {/* Backup Codes Grid */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4">
        {backupCodes.map((code, index) => (
          <div
            key={index}
            className="rounded bg-background px-3 py-2 text-center font-mono text-sm tracking-wider"
          >
            {code}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="saved-codes"
          checked={savedBackupCodes}
          onCheckedChange={(checked) => onSavedChange(checked === true)}
        />
        <label
          htmlFor="saved-codes"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Salvei meus códigos de backup em um lugar seguro
        </label>
      </div>

      <Button
        className="w-full"
        disabled={!savedBackupCodes}
        onClick={onComplete}
      >
        Concluir
      </Button>
    </div>
  );
}
