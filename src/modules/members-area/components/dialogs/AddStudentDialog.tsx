/**
 * AddStudentDialog - Modal para adicionar/convidar aluno
 */

import { useState } from "react";
import { UserPlus, Mail, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MemberGroup } from "@/modules/members-area/types";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  groups: MemberGroup[];
  onSuccess?: () => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  productId,
  groups,
  onSuccess,
}: AddStudentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Email inválido");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("students-invite/invite", {
        body: {
          product_id: productId,
          email: email.trim(),
          name: name.trim() || undefined,
          group_ids: selectedGroups.length > 0 ? selectedGroups : undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Convite enviado para ${email}`);
        handleClose();
        onSuccess?.();
      } else {
        throw new Error(data?.error || "Erro ao enviar convite");
      }
    } catch (err) {
      console.error("Error inviting student:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao enviar convite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setSelectedGroups([]);
    onOpenChange(false);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Aluno
          </DialogTitle>
          <DialogDescription>
            O aluno receberá um email com um link para acessar o produto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome do aluno
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nome completo (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email do aluno <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Grupos */}
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Grupos</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-muted/30">
                {groups.filter(g => g.is_active).map((group) => (
                  <div key={group.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`group-${group.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {group.name}
                      {group.is_default && (
                        <span className="ml-2 text-xs text-muted-foreground">(padrão)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione os grupos que o aluno terá acesso
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar aluno
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
