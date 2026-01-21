# Memory: modules/admin-xstate-architecture
Updated: 2026-01-21

O módulo Admin utiliza uma State Machine XState v5 com **parallel states** como Single Source of Truth. A arquitetura inclui:

1. **adminMachine.ts**: Machine principal com 4 regiões paralelas (users, products, orders, security)
2. **AdminContext.tsx**: Provider e hook `useAdmin()` que expõe estado e ações
3. **Actors centralizados**: Data fetching via `loadUsersActor`, `loadSecurityActor`, etc.

Hooks legados eliminados:
- `useSecurityAlerts.ts` → migrado para `adminMachine` security region

Todos os componentes Admin (AdminUsersTab, AdminProductsTab, AdminOrdersTab, AdminSecurityAlertsTab) consomem estado exclusivamente via `useAdmin()`, eliminando useState distribuídos.

RISE V3 Score: 10.0/10
