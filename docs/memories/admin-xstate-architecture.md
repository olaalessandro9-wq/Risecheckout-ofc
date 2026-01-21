# Memory: modules/admin-xstate-architecture
Updated: 2026-01-21

O módulo Admin utiliza uma State Machine XState v5 **simplificada** como Single Source of Truth. A arquitetura inclui:

1. **adminMachine.ts** (~112 linhas): Machine event-based com estado único `active` que processa todos os eventos
2. **AdminContext.tsx** (~184 linhas): Provider e hook `useAdmin()` que expõe estado e ações
3. **adminFetchers.ts** (~175 linhas): Data fetching para users, products, orders, security
4. **adminHandlers.ts** (~155 linhas): Handlers para ações complexas (role change, product actions, IP blocking)
5. **adminMachine.types.ts** (~246 linhas): Types centralizados para context e events

Arquitetura simplificada (vs v4):
- ❌ Removidos: actors/, regions/ (arquivos separados)
- ✅ Mantidos: fetchers e handlers modularizados fora do context

Hooks legados eliminados:
- `useSecurityAlerts.ts` → adminMachine + adminFetchers
- `useAdminOrders.ts` → adminMachine + adminFetchers

Todos os componentes Admin (AdminUsersTab, AdminProductsTab, AdminOrdersTab, AdminSecurityAlertsTab) consomem estado exclusivamente via `useAdmin()`.

File sizes:
- adminMachine.ts: 112 linhas
- AdminContext.tsx: 184 linhas
- adminFetchers.ts: 175 linhas
- adminHandlers.ts: 155 linhas
- adminMachine.types.ts: 246 linhas

RISE V3 Score: 10.0/10 (todos arquivos < 300 linhas)
