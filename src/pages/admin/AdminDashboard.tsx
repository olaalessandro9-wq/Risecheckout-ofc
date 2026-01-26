/**
 * AdminDashboard - Painel de Administração Principal
 * 
 * RISE Protocol V3 - XState Unified Architecture
 * 
 * Hub central para administradores e owners gerenciarem:
 * - Visão geral do sistema
 * - Métricas financeiras da plataforma
 * - Tráfego global
 * - Usuários e roles
 * - Health check do sistema
 * - Logs de segurança (apenas owner)
 * 
 * @version 3.0.0
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Activity, Shield, TrendingUp, DollarSign, Eye, Package, ShieldAlert, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminLogsTab } from "@/components/admin/AdminLogsTab";
import { AdminFinanceTab } from "@/components/admin/AdminFinanceTab";
import { AdminTrafficTab } from "@/components/admin/AdminTrafficTab";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminSecurityAlertsTab } from "@/components/admin/AdminSecurityAlertsTab";
import { AdminEmailPreviewTab } from "@/components/admin/AdminEmailPreviewTab";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminProvider, useAdmin } from "@/modules/admin/context";
import type { PeriodFilter, AdminTabId } from "@/modules/admin/types/admin.types";

interface RoleStats {
  role: string;
  count: number;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "all", label: "Todo período" },
];

function AdminDashboardContent() {
  const { canViewSecurityLogs, role } = usePermissions();
  const { context, changeTab, setPeriod } = useAdmin();

  const { data: roleStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-role-stats"],
    queryFn: async () => {
      const { data, error } = await api.call<{ roleStats?: RoleStats[] }>("admin-data", {
        action: "role-stats",
      });
      
      if (error) throw error;
      return data?.roleStats;
    },
  });

  const totalUsers = roleStats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  const getRoleLabel = (roleValue: string) => {
    const labels: Record<string, string> = {
      owner: "Owners",
      admin: "Admins",
      user: "Usuários",
      seller: "Sellers",
    };
    return labels[roleValue] || roleValue;
  };

  const getRoleColor = (roleValue: string) => {
    const colors: Record<string, string> = {
      owner: "text-amber-500",
      admin: "text-blue-500",
      user: "text-green-500",
      seller: "text-purple-500",
    };
    return colors[roleValue] || "text-muted-foreground";
  };

  const handleTabChange = (value: string) => {
    changeTab(value as AdminTabId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Painel de Administração</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários, monitore o sistema e visualize logs de segurança.
          </p>
        </div>
        <Select value={context.period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs 
        value={context.activeTab} 
        onValueChange={handleTabChange} 
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="traffic" className="gap-2">
            <Eye className="h-4 w-4" />
            Tráfego
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          {role === "owner" && (
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
          )}
          {role === "owner" && (
            <TabsTrigger value="orders" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
          )}
          <TabsTrigger value="system" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          {role === "owner" && (
            <TabsTrigger value="security" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          )}
          {canViewSecurityLogs && (
            <TabsTrigger value="logs" className="gap-2">
              <Shield className="h-4 w-4" />
              Logs
            </TabsTrigger>
          )}
          {role === "owner" && (
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="finance">
          <AdminFinanceTab period={context.period} />
        </TabsContent>

        <TabsContent value="traffic">
          <AdminTrafficTab period={context.period} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : totalUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuários cadastrados na plataforma
                </p>
              </CardContent>
            </Card>

            {roleStats?.map((stat) => (
              <Card key={stat.role}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{getRoleLabel(stat.role)}</CardTitle>
                  <Shield className={`h-4 w-4 ${getRoleColor(stat.role)}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.role === "owner" && "Acesso total ao sistema"}
                    {stat.role === "admin" && "Administradores"}
                    {stat.role === "user" && "Podem ter afiliados"}
                    {stat.role === "seller" && "Vendedores básicos"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Seu Acesso
              </CardTitle>
              <CardDescription>
                Informações sobre seu nível de acesso no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role atual:</span>
                <span className={`font-medium ${getRoleColor(role)}`}>
                  {getRoleLabel(role)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersTab />
        </TabsContent>

        {role === "owner" && (
          <TabsContent value="products">
            <AdminProductsTab />
          </TabsContent>
        )}

        {role === "owner" && (
          <TabsContent value="orders">
            <AdminOrdersTab />
          </TabsContent>
        )}

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
              <CardDescription>
                Monitoramento e health check do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Acesse o Health Check para verificar o status de todos os componentes do sistema.
              </p>
              <Button asChild>
                <Link to="/dashboard/admin/health">
                  Abrir Health Check
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {role === "owner" && (
          <TabsContent value="security">
            <AdminSecurityAlertsTab />
          </TabsContent>
        )}

        {canViewSecurityLogs && (
          <TabsContent value="logs">
            <AdminLogsTab />
          </TabsContent>
        )}

        {role === "owner" && (
          <TabsContent value="emails">
            <AdminEmailPreviewTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
