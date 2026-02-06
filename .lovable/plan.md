

# Fix: Persistencia de Capa do Modulo + Sincronizacao Builder/Content

## Diagnostico (Investigacao Profunda)

### Problema 1: Builder nao persiste alteracoes de modulo

O `EditMemberModuleDialog` (builder) faz o upload da imagem corretamente para o storage, mas o callback `onUpdate` aponta para `actions.updateModule` em `useMembersAreaState.ts` (linha 223-225), que apenas faz:

```text
send({ type: 'UPDATE_MODULE', id, data })
```

Isso so atualiza o estado LOCAL do XState. **Nenhuma chamada de API e feita.** Ao dar F5, os dados sao re-fetched do banco e a alteracao se perde.

Em contraste, o `ContentTab` usa `useMembersAreaModules.updateModule` que faz:

```text
api.call('members-area-modules', { action: 'update', moduleId, data })  // <- Persiste no banco
dispatch({ type: 'UPDATE_MODULE', id, data })                           // <- Atualiza estado local
```

### Problema 2: Sem sincronizacao entre Builder e Content

Os dois views usam sistemas de estado completamente separados:

```text
Content Tab:
  useMembersAreaSettings -> React Query (queryKey: ["members-area", "modules", productId])
                         -> XState (membersAreaMachine)

Builder:
  useMembersAreaState    -> XState (builderMachine) - sem React Query
```

Nao existe cache invalidation cruzada. Editar no Content nao atualiza o Builder e vice-versa.

## Solucao

### Arquivo 1: `src/modules/members-area-builder/hooks/useMembersAreaState.ts`

**Problema:** `updateModule` so faz dispatch local.

**Correcao:** Reescrever `updateModule` para chamar a API `members-area-modules` com `action: 'update'` antes de fazer o dispatch local, seguindo exatamente o mesmo padrao de `useMembersAreaModules.updateModule`.

Alem disso, importar `useQueryClient` e invalidar a query `["members-area", "modules", productId]` apos o update bem-sucedido, para que quando o usuario voltar ao Content tab, os dados estejam atualizados.

```text
// ANTES (linha 223-225):
const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
  send({ type: 'UPDATE_MODULE', id, data });
}, [send]);

// DEPOIS:
const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
  // 1. Persist to database via Edge Function
  const { error } = await api.call<{ success: boolean; error?: string }>('members-area-modules', {
    action: 'update',
    moduleId: id,
    data,
  });

  if (error) {
    log.error("Failed to update module", { error });
    toast.error("Erro ao atualizar modulo");
    return;
  }

  // 2. Update local XState state
  send({ type: 'UPDATE_MODULE', id, data });

  // 3. Invalidate React Query cache for cross-view sync
  queryClient.invalidateQueries({ 
    queryKey: ["members-area", "modules", productId] 
  });
}, [send, productId, queryClient]);
```

Imports adicionais necessarios:
- `import { useQueryClient } from "@tanstack/react-query";`
- `import { api } from "@/lib/api";`
- `import { createLogger } from "@/lib/logger";`
- `import { membersAreaQueryKeys } from "@/modules/members-area/hooks/useMembersAreaSettings";`

### Arquivo 2: `src/modules/members-area/hooks/useMembersAreaModules.ts`

**Problema:** Apos update bem-sucedido, nao invalida o cache do React Query.

**Correcao:** Importar `useQueryClient` e `membersAreaQueryKeys`, e invalidar o cache apos `api.call` bem-sucedido. Isso garante que quando o usuario abrir o Builder, os dados la tambem estarao atualizados.

```text
// ANTES (linha 70-85):
const updateModule = useCallback(async (id, updateData) => {
  const { error } = await api.call('members-area-modules', { ... });
  if (error) { ... return; }
  dispatch({ type: 'UPDATE_MODULE', id, data: updateData });
  toast.success("Modulo atualizado!");
}, [dispatch]);

// DEPOIS:
const updateModule = useCallback(async (id, updateData) => {
  const { error } = await api.call('members-area-modules', { ... });
  if (error) { ... return; }
  dispatch({ type: 'UPDATE_MODULE', id, data: updateData });
  // Invalidar cache para sincronizacao com builder
  queryClient.invalidateQueries({ 
    queryKey: membersAreaQueryKeys.modules(productId!) 
  });
  toast.success("Modulo atualizado!");
}, [dispatch, productId, queryClient]);
```

## Resumo das Mudancas

```text
src/modules/members-area-builder/hooks/
  useMembersAreaState.ts    <-- EDITAR (updateModule: adicionar API call + cache invalidation)

src/modules/members-area/hooks/
  useMembersAreaModules.ts  <-- EDITAR (updateModule: adicionar cache invalidation)
```

## Fluxo Resultante

```text
Builder (Editar Modulo -> Salvar):
  1. Upload imagem -> storage (ja funciona)
  2. api.call('members-area-modules', { action: 'update' }) -> banco (NOVO)
  3. send({ type: 'UPDATE_MODULE' }) -> XState local (ja funciona)
  4. queryClient.invalidateQueries(["members-area", "modules", productId]) (NOVO)
  5. F5 -> dados persistidos no banco -> OK

Content Tab (Editar Modulo -> Salvar):
  1. Upload imagem -> storage (ja funciona)
  2. api.call('members-area-modules', { action: 'update' }) -> banco (ja funciona)
  3. dispatch({ type: 'UPDATE_MODULE' }) -> XState local (ja funciona)
  4. queryClient.invalidateQueries(["members-area", "modules", productId]) (NOVO)
  5. Builder aberto apos -> dados atualizados via cache invalidation -> OK
```

## Checkpoint de Qualidade

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim -- segue o padrao ja existente em useMembersAreaModules |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero -- usa APIs ja existentes (api.call, queryClient) |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim -- React Query invalidation e padrao estavel |
| Estou escolhendo isso por ser mais rapido? | Nao -- e a correcao correta da arquitetura |

