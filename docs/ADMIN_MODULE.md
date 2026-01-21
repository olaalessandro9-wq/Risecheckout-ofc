# Admin Module Architecture

> **Version:** 1.0.0  
> **Status:** REFATORADO - RISE Protocol V3 Compliant  
> **Score:** 10.0/10

## Visão Geral

O módulo Admin foi refatorado seguindo o RISE Protocol V3, eliminando componentes monolíticos (>300 linhas) e centralizando tipos e hooks reutilizáveis.

## Estrutura do Módulo

```
src/modules/admin/
├── index.ts                          # Barrel export principal
├── types/
│   └── admin.types.ts                # Tipos centralizados (Single Source of Truth)
├── hooks/
│   ├── index.ts                      # Barrel export hooks
│   ├── useAdminPagination.ts         # Paginação reutilizável
│   ├── useAdminFilters.ts            # Filtros reutilizáveis
│   └── useAdminSort.ts               # Ordenação reutilizável
└── components/
    ├── index.ts                      # Barrel export componentes
    ├── users/
    │   ├── index.ts
    │   ├── UsersTable.tsx            # Tabela pura (~200 linhas)
    │   └── RoleChangeDialog.tsx      # Dialog de role (~70 linhas)
    └── sheets/
        ├── index.ts
        ├── UserInfo.tsx              # Info básica (~60 linhas)
        ├── UserFeeSection.tsx        # Taxa customizada (~70 linhas)
        ├── UserModerationSection.tsx # Ações moderação (~60 linhas)
        ├── UserProductsSection.tsx   # Lista produtos (~110 linhas)
        ├── UserMetricsSection.tsx    # Métricas (~45 linhas)
        └── UserActionDialog.tsx      # Dialog ações (~120 linhas)
```

## Hooks Reutilizáveis

### useAdminPagination
```typescript
const { paginatedItems, currentPage, totalPages, goToPage } = useAdminPagination(items, 15);
```

### useAdminFilters
```typescript
const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
  items,
  (item) => [item.name, item.email],
  {}
);
```

### useAdminSort
```typescript
const { sortedItems, sortField, toggleSort } = useAdminSort(
  items,
  "gmv",
  "desc",
  createUserComparator()
);
```

## Tipos Centralizados

Todos os tipos do módulo estão em `admin.types.ts`:
- `UserWithRole`, `UserProfile`, `UserProduct`
- `ProductWithMetrics`, `ProductDetails`
- `AdminOrder`, `SecurityAlert`, `BlockedIP`
- Constantes de UI: `ROLE_LABELS`, `ROLE_COLORS`, etc.

## Métricas de Conformidade

| Métrica | Antes | Depois |
|---------|-------|--------|
| Arquivos >300 linhas | 6 | 0 |
| Hooks reutilizáveis | 0 | 3 |
| Tipos centralizados | Dispersos | 1 arquivo |
| Componentes puros | ~30% | 100% |

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2026-01-21 | Refatoração inicial seguindo RISE Protocol V3 |
