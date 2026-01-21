/**
 * BlockedIPsList - Lista de IPs Bloqueados
 * 
 * Componente puro que exibe a tabela de IPs bloqueados.
 * 
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ban, Plus, Unlock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  block_count: number;
}

interface BlockedIPsListProps {
  blockedIPs: BlockedIP[];
  isLoading: boolean;
  onUnblock: (ipAddress: string) => void;
  onOpenBlockDialog: () => void;
  onRefresh: () => void;
}

export function BlockedIPsList({
  blockedIPs,
  isLoading,
  onUnblock,
  onOpenBlockDialog,
  onRefresh,
}: BlockedIPsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            IPs Bloqueados
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={onOpenBlockDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Bloquear IP
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : blockedIPs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum IP bloqueado no momento.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Bloqueado em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Bloqueios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{ip.ip_address}</TableCell>
                  <TableCell>{ip.reason}</TableCell>
                  <TableCell>
                    {format(new Date(ip.blocked_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {ip.expires_at ? (
                      format(new Date(ip.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    ) : (
                      <Badge variant="destructive">Permanente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ip.block_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnblock(ip.ip_address)}
                    >
                      <Unlock className="h-4 w-4 mr-1" />
                      Desbloquear
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
