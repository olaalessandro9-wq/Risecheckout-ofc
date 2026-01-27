

# Plano: Correção da Exclusão de Conteúdo na Área de Membros

## Diagnóstico

### Erro Identificado
- **Sintoma**: Erro 400 ao tentar excluir conteúdo na área de membros
- **Mensagem no console**: `Failed to load resource: the server responded with a status of 400 ()`
- **Toast**: "Erro ao excluir conteúdo"

### Causa Raiz

O hook `useMembersAreaContents.ts` está chamando a **Edge Function errada**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO ATUAL (INCORRETO)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  useMembersAreaContents                                                      │
│  │                                                                           │
│  └── api.call('admin-data', { action: 'delete-member-content' })            │
│                    │                                                         │
│                    ▼                                                         │
│              admin-data                                                      │
│              │                                                               │
│              └── switch(action)                                             │
│                  │                                                           │
│                  ├── case "delete-member-content" → NÃO EXISTE ❌           │
│                  │                                                           │
│                  └── default → return 400 "Ação desconhecida"               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

Enquanto isso, existe a Edge Function `content-crud` que já implementa todas as operações de conteúdo (create, update, delete, reorder) corretamente.

---

## Solução

### Correção no Frontend

Alterar o hook `useMembersAreaContents.ts` para chamar a Edge Function correta (`content-crud`) com os nomes de ação corretos.

**Mapeamento de Correção:**

| Ação Atual (ERRADA) | Edge Function Atual | Ação Correta | Edge Function Correta |
|---------------------|---------------------|--------------|----------------------|
| `create-member-content` | `admin-data` | `create` | `content-crud` |
| `update-member-content` | `admin-data` | `update` | `content-crud` |
| `delete-member-content` | `admin-data` | `delete` | `content-crud` |
| `reorder-member-contents` | `admin-data` | `reorder` | `content-crud` |

---

## Alterações Necessárias

### Arquivo: `src/modules/members-area/hooks/useMembersAreaContents.ts`

**Mudança 1: `addContent` (linhas 46-51)**

```typescript
// ANTES
const { data: result, error } = await api.call<...>('admin-data', {
  action: 'create-member-content',
  moduleId,
  ...data,
  position,
});

// DEPOIS
const { data: result, error } = await api.call<...>('content-crud', {
  action: 'create',
  moduleId,
  data: {
    ...data,
    position,
  },
});
```

**Mudança 2: `updateContent` (linhas 65-69)**

```typescript
// ANTES
const { error } = await api.call<...>('admin-data', {
  action: 'update-member-content',
  contentId: id,
  ...data,
});

// DEPOIS
const { error } = await api.call<...>('content-crud', {
  action: 'update',
  contentId: id,
  data,
});
```

**Mudança 3: `deleteContent` (linhas 82-85)**

```typescript
// ANTES
const { error } = await api.call<...>('admin-data', {
  action: 'delete-member-content',
  contentId: id,
});

// DEPOIS
const { error } = await api.call<...>('content-crud', {
  action: 'delete',
  contentId: id,
});
```

**Mudança 4: `reorderContents` (linhas 104-108)**

```typescript
// ANTES
const { error } = await api.call<...>('admin-data', {
  action: 'reorder-member-contents',
  moduleId,
  orderedIds,
});

// DEPOIS
const { error } = await api.call<...>('content-crud', {
  action: 'reorder',
  moduleId,
  orderedIds,
});
```

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUXO CORRIGIDO                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  useMembersAreaContents                                                      │
│  │                                                                           │
│  └── api.call('content-crud', { action: 'delete', contentId })              │
│                    │                                                         │
│                    ▼                                                         │
│              content-crud                                                    │
│              │                                                               │
│              └── if (action === "delete")                                   │
│                  │                                                           │
│                  ├── verifyContentOwnership() ✅                            │
│                  │                                                           │
│                  ├── supabase.delete() ✅                                   │
│                  │                                                           │
│                  └── return { success: true } ✅                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Mudanças |
|---------|----------|
| `src/modules/members-area/hooks/useMembersAreaContents.ts` | Trocar 4 chamadas de `admin-data` para `content-crud` com actions corretas |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Resolve causa raiz | Usa Edge Function correta |
| Zero workarounds | Sem gambiarras |
| Mantém arquivos < 300 linhas | Arquivo atual tem 127 linhas |
| Zero breaking changes | Apenas corrige chamadas incorretas |
| Logging mantido | Nenhuma alteração no logging |

---

## Testes Esperados

Após implementação:
1. Abrir Área de Membros de um produto
2. Expandir um módulo com conteúdos
3. Clicar no botão de excluir conteúdo (lixeira)
4. Toast "Conteúdo excluído!" deve aparecer
5. Conteúdo deve desaparecer da lista

Também testar:
- Criar novo conteúdo
- Atualizar conteúdo existente
- Reordenar conteúdos via drag-and-drop

