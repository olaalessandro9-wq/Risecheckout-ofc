/**
 * AdminLogsTab - Aba de logs de segurança (apenas owner)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecurityLog {
  id: string;
  action: string;
  user_id: string | null;
  resource: string | null;
  resource_id: string | null;
  success: boolean | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export function AdminLogsTab() {
  /**
   * Carrega logs via Edge Function
   * MIGRATED: Uses admin-data Edge Function
   */
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-security-logs"],
    queryFn: async () => {
      const sessionToken = localStorage.getItem('producer_session_token');
      
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: {
          action: 'security-logs',
          limit: 100,
        },
        headers: {
          'x-producer-session-token': sessionToken || '',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return (data?.logs || []) as SecurityLog[];
    },
  });

  const getActionBadge = (action: string, success: boolean | null) => {
    const isError = action.includes("DENIED") || action.includes("FAILED") || success === false;
    const isWarning = action.includes("ATTEMPT") || action.includes("BLOCKED");
    
    if (isError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {action}
        </Badge>
      );
    }
    
    if (isWarning) {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-500">
          <AlertTriangle className="h-3 w-3" />
          {action}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-1 border-green-500/20 bg-green-500/10 text-green-500">
        <CheckCircle className="h-3 w-3" />
        {action}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Logs de Segurança
        </CardTitle>
        <CardDescription>
          Últimos 100 eventos de segurança registrados no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action, log.success)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.resource || "-"}
                        {log.resource_id && (
                          <span className="block text-xs text-muted-foreground font-mono">
                            {log.resource_id.slice(0, 8)}...
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.user_id ? `${log.user_id.slice(0, 8)}...` : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.ip_address || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
