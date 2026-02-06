
# Fix: Modal de Exclusao Reaparece Apos Confirmar

## Diagnostico: Causa Raiz Profunda

O bug ocorre por uma **race condition entre o fechamento do dialog e o re-render causado pelo refetch** do React Query.

### Rastreamento Completo do Fluxo

```text
FLUXO DO BUG (passo a passo):

1. Usuario clica "Excluir" -> handleDelete chama confirm({...})
   -> setState({ open: true, onConfirm: wrappedFn })
   -> Bridge renderiza AlertDialog

2. Usuario digita EXCLUIR e clica no botao
   -> Bridge.onClick: setBusy(true), await state.onConfirm()

3. state.onConfirm() executa:
   -> await deleteMutation.mutateAsync(productId)
   -> deleteProductCascade completa com sucesso

4. mutateAsync AGUARDA onSuccess:
   -> toast.success(...)
   -> await qc.invalidateQueries(...)    <--- AQUI ESTA O PROBLEMA
   -> Refetch dispara -> Lista de produtos atualiza -> COMPONENTE RE-RENDERIZA

5. Durante o re-render:
   -> useConfirmDelete() re-executa
   -> NOVO Bridge e criado (nova referencia de funcao)
   -> React ve novo "tipo de componente" -> DESMONTA Bridge antigo
   -> MONTA Bridge novo com busy = false (estado local resetado)
   -> state.open AINDA e true (setState(null) nao foi chamado)
   -> AlertDialog renderiza com open=true -> MODAL REAPARECE

6. Refetch completa -> mutateAsync resolve
   -> onConfirm wrapper: resolve(true) -> setState(null) no finally
   -> Modal fecha (apos ~1 segundo de flash)
```

### Os Dois Defeitos Arquiteturais

| Defeito | Local | Descricao |
|---------|-------|-----------|
| **Timing** | `useProductsTable.ts` linha 112 | `await qc.invalidateQueries(...)` em `onSuccess` faz `mutateAsync` aguardar o refetch ANTES de `setState(null)` fechar o dialog |
| **Identidade** | `ConfirmDelete.tsx` linha 200 | `Bridge` e uma funcao inline criada a cada render -> React desmonta/remonta perdendo o estado `busy` |

---

## Analise de Solucoes

### Solucao A: Apenas remover `await` da invalidacao

Remover `await` de `qc.invalidateQueries(...)` no `onSuccess` do `deleteMutation`. O refetch vira fire-and-forget.

- Manutenibilidade: 7/10 (resolve o sintoma no useProductsTable, mas o defeito do Bridge persiste)
- Zero DT: 5/10 (qualquer outro consumidor de useConfirmDelete que cause re-render tera o mesmo bug)
- Arquitetura: 5/10 (nao corrige a causa raiz no ConfirmDelete)
- Escalabilidade: 5/10 (cada novo uso de useConfirmDelete precisa "lembrar" de nao causar re-renders)
- Seguranca: 10/10
- **NOTA FINAL: 6.0/10**

### Solucao B: Fix Completo - Timing + Identidade do Bridge

Corrigir AMBOS os defeitos:
1. **Timing**: Remover `await` de `qc.invalidateQueries(...)` em `onSuccess` para que o dialog feche antes do refetch
2. **Identidade do Bridge**: Mover `busy` para o estado do hook (dentro do objeto `state`) em vez de estado local do Bridge. Isso impede perda de estado caso Bridge seja recriado por qualquer motivo

- Manutenibilidade: 10/10 (corrige a causa raiz em ambos os pontos, qualquer consumidor funciona corretamente)
- Zero DT: 10/10 (nenhum consumidor futuro tera esse problema)
- Arquitetura: 10/10 (estado de loading no lugar correto, separacao clara)
- Escalabilidade: 10/10 (funciona para qualquer uso de useConfirmDelete)
- Seguranca: 10/10
- **NOTA FINAL: 10.0/10**

### DECISAO: Solucao B (Nota 10.0)

A Solucao A e um band-aid que resolve o caso especifico do ProductsTable mas deixa o defeito arquitetural no ConfirmDelete intacto. A Solucao B elimina a classe inteira de bugs.

---

## Plano de Execucao

### 1. EDITAR `src/components/common/ConfirmDelete.tsx` - Mover `busy` para estado do hook

**Problema**: `Bridge` e uma funcao inline dentro de `useConfirmDelete`. Quando o componente pai re-renderiza, React cria uma nova instancia do Bridge, perdendo o estado local `busy`.

**Fix**: Mover `busy` para dentro do objeto `state` do hook (que sobrevive a re-renders do Bridge):

- Tipo do state: `null | (ConfirmArgs & { open: boolean; busy: boolean })`
- No `onClick` do botao Excluir: `setState(prev => prev ? { ...prev, busy: true } : prev)`
- No `finally`: `setState(null)` (como ja esta)
- Bridge le `state.busy` em vez de manter estado local
- `onOpenChange` verifica `state.busy` em vez de `busy` local

### 2. EDITAR `src/components/products/products-table/useProductsTable.ts` - Remover await da invalidacao

**Problema**: `await qc.invalidateQueries(...)` no `onSuccess` do `deleteMutation` faz `mutateAsync` esperar pelo refetch. Como `mutateAsync` e aguardado pelo `onConfirm` wrapper, o `setState(null)` so executa DEPOIS do refetch (que causa o re-render que recria o Bridge).

**Fix**: Remover `await` da invalidacao. O refetch acontece em background (fire-and-forget). A lista atualiza naturalmente quando o refetch completa, sem bloquear o fechamento do dialog.

De:
```typescript
onSuccess: async () => {
  toast.success("Produto excluido com sucesso!");
  await qc.invalidateQueries({ queryKey: productQueryKeys.all });
},
```

Para:
```typescript
onSuccess: () => {
  toast.success("Produto excluido com sucesso!");
  qc.invalidateQueries({ queryKey: productQueryKeys.all });
},
```

---

## Arvore de Arquivos

```text
src/
  components/
    common/
      ConfirmDelete.tsx                                    -- EDITAR (mover busy para state do hook)
    products/
      products-table/
        useProductsTable.ts                                -- EDITAR (remover await da invalidacao)
```

## Comportamento Esperado Apos Fix

1. Usuario clica "Excluir" -> modal abre
2. Usuario digita EXCLUIR e clica -> spinner "Excluindo..." aparece
3. Exclusao completa -> modal fecha -> toast "Produto excluido com sucesso!"
4. Lista de produtos atualiza em background (sem flash do modal)

## Checkpoint de Qualidade RISE V3

| Pergunta | Resposta |
|----------|----------|
| Esta e a MELHOR solucao possivel? | Sim - corrige ambos os defeitos (timing + identidade) |
| Existe alguma solucao com nota maior? | Nao |
| Isso cria divida tecnica? | Zero - corrige divida existente |
| Precisaremos "melhorar depois"? | Nao |
| O codigo sobrevive 10 anos sem refatoracao? | Sim |
| Estou escolhendo isso por ser mais rapido? | Nao - e a unica que elimina a classe inteira de bugs |
