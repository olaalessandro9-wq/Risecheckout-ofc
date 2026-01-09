/**
 * AdminSecurityAlertsTab - Dashboard de Alertas de Segurança
 * 
 * Exibe alertas de segurança em tempo real com:
 * - Cards de estatísticas (críticos, IPs bloqueados, brute force, rate limits)
 * - Lista filtrada de alertas
 * - Gerenciamento de IP blocklist
 * - Ações de reconhecer/investigar/bloquear
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldAlert, 
  ShieldX, 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  RefreshCw, 
  Eye,
  Clock,
  Loader2,
  XCircle
} from "lucide-react";
import { useSecurityAlerts, type SecurityAlert, type AlertFilters } from "@/hooks/useSecurityAlerts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mapear tipos de alerta para ícones e cores
const ALERT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  brute_force: { 
    icon: <ShieldX className="h-4 w-4" />, 
    label: "Brute Force", 
    color: "text-red-500" 
  },
  ip_blocked: { 
    icon: <Ban className="h-4 w-4" />, 
    label: "IP Bloqueado", 
    color: "text-orange-500" 
  },
  rate_limit_exceeded: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    label: "Rate Limit", 
    color: "text-yellow-500" 
  },
  suspicious_activity: { 
    icon: <Eye className="h-4 w-4" />, 
    label: "Atividade Suspeita", 
    color: "text-purple-500" 
  },
};

// Mapear severidades para badges
const SEVERITY_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  low: { variant: "secondary", label: "Baixa" },
  medium: { variant: "outline", label: "Média" },
  high: { variant: "default", label: "Alta" },
  critical: { variant: "destructive", label: "Crítica" },
};

export function AdminSecurityAlertsTab() {
  const { 
    alerts, 
    blockedIPs, 
    stats, 
    isLoading, 
    fetchAlerts,
    acknowledgeAlert, 
    blockIP, 
    unblockIP,
    refresh 
  } = useSecurityAlerts();

  const [filters, setFilters] = useState<AlertFilters>({});
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ ip: "", reason: "", days: "7" });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Aplicar filtros
  useEffect(() => {
    fetchAlerts(filters);
  }, [filters, fetchAlerts]);

  const handleBlockIP = async () => {
    if (!blockForm.ip || !blockForm.reason) return;
    
    await blockIP(blockForm.ip, blockForm.reason, parseInt(blockForm.days));
    setBlockDialogOpen(false);
    setBlockForm({ ip: "", reason: "", days: "7" });
  };

  const getAlertTypeConfig = (type: string) => {
    return ALERT_TYPE_CONFIG[type] || { 
      icon: <AlertTriangle className="h-4 w-4" />, 
      label: type, 
      color: "text-muted-foreground" 
    };
  };

  const getSeverityConfig = (severity: string) => {
    return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Alertas de Segurança
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento de ameaças e atividades suspeitas em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "text-green-600" : ""}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className={stats?.criticalAlerts24h ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos (24h)</CardTitle>
            <ShieldX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.criticalAlerts24h || 0}</div>
            <p className="text-xs text-muted-foreground">Alertas de alta severidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPs Bloqueados</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedIPsActive || 0}</div>
            <p className="text-xs text-muted-foreground">Ativos na blocklist</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brute Force</CardTitle>
            <ShieldX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bruteForceAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">Tentativas (24h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rateLimitExceeded || 0}</div>
            <p className="text-xs text-muted-foreground">Excedidos (24h)</p>
          </CardContent>
        </Card>

        <Card className={stats?.unacknowledgedAlerts ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Reconhecidos</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unacknowledgedAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando revisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Alertas e IP Blocklist */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Alertas
            {stats?.unacknowledgedAlerts ? (
              <Badge variant="destructive" className="ml-1">
                {stats.unacknowledgedAlerts}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="blocklist" className="gap-2">
            <Ban className="h-4 w-4" />
            IP Blocklist
            {stats?.blockedIPsActive ? (
              <Badge variant="secondary" className="ml-1">
                {stats.blockedIPsActive}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <Select 
              value={filters.type || "all"} 
              onValueChange={(v) => setFilters({ ...filters, type: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de alerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="brute_force">Brute Force</SelectItem>
                <SelectItem value="ip_blocked">IP Bloqueado</SelectItem>
                <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                <SelectItem value="suspicious_activity">Atividade Suspeita</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.severity || "all"} 
              onValueChange={(v) => setFilters({ ...filters, severity: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas severidades</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.acknowledged === undefined ? "all" : filters.acknowledged ? "yes" : "no"} 
              onValueChange={(v) => setFilters({ 
                ...filters, 
                acknowledged: v === "all" ? undefined : v === "yes" 
              })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="no">Não reconhecidos</SelectItem>
                <SelectItem value="yes">Reconhecidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de alertas */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ShieldCheck className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-lg font-medium">Nenhum alerta encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Tudo parece seguro por aqui!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => {
                  const typeConfig = getAlertTypeConfig(alert.alert_type);
                  const severityConfig = getSeverityConfig(alert.severity);

                  return (
                    <Alert 
                      key={alert.id} 
                      variant={alert.severity === "critical" ? "destructive" : "default"}
                      className={alert.acknowledged ? "opacity-60" : ""}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={typeConfig.color}>
                            {typeConfig.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={severityConfig.variant}>
                                {severityConfig.label}
                              </Badge>
                              <span className="text-sm font-medium">
                                {typeConfig.label}
                              </span>
                              {alert.acknowledged && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Reconhecido
                                </Badge>
                              )}
                            </div>
                            
                            <AlertTitle className="mb-1">
                              {alert.ip_address && `IP: ${alert.ip_address}`}
                            </AlertTitle>
                            
                            <AlertDescription className="text-sm">
                              {String((alert.details as Record<string, unknown>)?.reason || 
                               (alert.details as Record<string, unknown>)?.message ||
                               `${(alert.details as Record<string, unknown>)?.attempts || 0} tentativas detectadas`)}
                            </AlertDescription>

                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alert.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {alert.ip_address && !alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBlockForm({ 
                                  ip: alert.ip_address!, 
                                  reason: `Bloqueado via alerta: ${alert.alert_type}`,
                                  days: "7"
                                });
                                setBlockDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Bloquear IP
                            </Button>
                          )}
                          
                          {!alert.acknowledged && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reconhecer
                            </Button>
                          )}
                        </div>
                      </div>
                    </Alert>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab: IP Blocklist */}
        <TabsContent value="blocklist" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              IPs atualmente bloqueados de acessar o sistema
            </p>
            <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Ban className="h-4 w-4 mr-2" />
                  Bloquear IP Manualmente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloquear IP</DialogTitle>
                  <DialogDescription>
                    Adicione um IP à blocklist para impedir acesso ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip">Endereço IP</Label>
                    <Input
                      id="ip"
                      placeholder="192.168.1.100"
                      value={blockForm.ip}
                      onChange={(e) => setBlockForm({ ...blockForm, ip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo</Label>
                    <Input
                      id="reason"
                      placeholder="Atividade suspeita detectada"
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="days">Duração (dias)</Label>
                    <Select 
                      value={blockForm.days} 
                      onValueChange={(v) => setBlockForm({ ...blockForm, days: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia</SelectItem>
                        <SelectItem value="7">7 dias</SelectItem>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                        <SelectItem value="0">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleBlockIP} variant="destructive">
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {blockedIPs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShieldCheck className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">Nenhum IP bloqueado</p>
                  <p className="text-sm text-muted-foreground">
                    A blocklist está vazia
                  </p>
                </CardContent>
              </Card>
            ) : (
              blockedIPs.map((ip) => (
                <Card key={ip.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Ban className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-mono font-medium">{ip.ip_address}</p>
                        <p className="text-sm text-muted-foreground">{ip.reason}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Bloqueado: {formatDistanceToNow(new Date(ip.blocked_at), { addSuffix: true, locale: ptBR })}</span>
                          {ip.expires_at && (
                            <span>Expira: {formatDistanceToNow(new Date(ip.expires_at), { addSuffix: true, locale: ptBR })}</span>
                          )}
                          {ip.block_count > 1 && (
                            <Badge variant="secondary">Bloqueado {ip.block_count}x</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => unblockIP(ip.ip_address)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Desbloquear
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes do alerta */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{getAlertTypeConfig(selectedAlert.alert_type).label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severidade</Label>
                  <Badge variant={getSeverityConfig(selectedAlert.severity).variant}>
                    {getSeverityConfig(selectedAlert.severity).label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">IP</Label>
                  <p className="font-mono">{selectedAlert.ip_address || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p>{new Date(selectedAlert.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Detalhes</Label>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-sm overflow-auto max-h-64">
                  {JSON.stringify(selectedAlert.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Fechar
            </Button>
            {selectedAlert && !selectedAlert.acknowledged && (
              <Button onClick={() => {
                acknowledgeAlert(selectedAlert.id);
                setSelectedAlert(null);
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Reconhecer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
