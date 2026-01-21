/**
 * BlockIPDialog - Dialog para Bloquear IP
 * 
 * Componente puro que exibe o dialog para bloquear um IP manualmente.
 * 
 * @version 1.0.0
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ban } from "lucide-react";

interface BlockIPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlock: (ipAddress: string, reason: string, expiresInDays?: number) => void;
  isLoading?: boolean;
}

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 dia" },
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "permanent", label: "Permanente" },
];

export function BlockIPDialog({
  open,
  onOpenChange,
  onBlock,
  isLoading = false,
}: BlockIPDialogProps) {
  const [ipAddress, setIpAddress] = useState("");
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState("7");

  const handleSubmit = () => {
    if (!ipAddress.trim() || !reason.trim()) return;
    
    const expiresInDays = expiry === "permanent" ? undefined : parseInt(expiry, 10);
    onBlock(ipAddress.trim(), reason.trim(), expiresInDays);
    
    // Reset form
    setIpAddress("");
    setReason("");
    setExpiry("7");
  };

  const isValid = ipAddress.trim().length > 0 && reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bloquear IP Manualmente
          </DialogTitle>
          <DialogDescription>
            Adicione um endereço IP à lista de bloqueio. O IP não poderá acessar o sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ip-address">Endereço IP</Label>
            <Input
              id="ip-address"
              placeholder="192.168.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Bloqueio</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do bloqueio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Duração do Bloqueio</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Bloqueando..." : "Bloquear IP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
