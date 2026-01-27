

# Plano: Documentar Padrão useRef para Estabilização de Callbacks

## RISE Protocol V3 - Conformidade 10.0/10

Esta atualização documenta um padrão arquitetural crítico já implementado no código, garantindo que futuros desenvolvedores sigam a mesma abordagem.

---

## Objetivo

Adicionar a **Seção 7: React Patterns** ao arquivo `docs/CODING_STANDARDS.md` documentando o padrão de estabilização de callbacks com `useRef`.

---

## Alterações

### Arquivo: `docs/CODING_STANDARDS.md`

**Atualização 1:** Atualizar data no header (linha 4)

```markdown
> Última atualização: 2026-01-27
```

**Atualização 2:** Adicionar nova seção após a seção 6 (após linha 173)

```markdown
---

## 7. React Patterns

### 7.1 Estabilização de Callbacks com useRef

#### Regra Absoluta

Callbacks externos passados para hooks de data fetching **NUNCA** devem ser incluídos no array de dependências de `useCallback` ou `useEffect`.

#### Problema

Quando um callback (ex: `onBack`, `onSave`) é passado como prop e incluído nas dependências:

```typescript
// PROIBIDO - Causa loop infinito
const loadData = useCallback(async () => {
  // ... fetch data
  if (error) onBack(); // callback usado
}, [contentId, onBack]); // onBack nas dependências

useEffect(() => {
  loadData();
}, [loadData]); // Re-executa quando loadData muda
```

**Cadeia de eventos do loop:**
1. Parent renderiza e cria nova referência de `onBack`
2. `loadData` é recriado (nova dependência)
3. `useEffect` detecta mudança e executa `loadData()`
4. `setIsLoading(true)` causa re-render
5. Volta ao passo 1 - LOOP INFINITO

#### Solução Correta

Usar `useRef` para armazenar callbacks de ação:

```typescript
import { useState, useEffect, useCallback, useRef } from "react";

export function useDataFetchingHook({
  dataId,
  onBack,  // Callback externo
}: Props) {
  // RISE V3: Ref para callbacks que NÃO devem influenciar data fetching
  const onBackRef = useRef(onBack);
  
  // Manter ref atualizada sem causar re-execução
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await api.call("endpoint", { dataId });
      
      if (error) {
        toast.error("Erro ao carregar");
        // RISE V3: Usar ref.current - não afeta dependências
        onBackRef.current();
        return;
      }
      
      // ... processar dados
    } catch (err) {
      log.error("Exception:", err);
    }
  }, [dataId]); // onBack REMOVIDO das dependências

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // ...
}
```

#### Quando Aplicar

| Cenário | Usar useRef? |
|---------|--------------|
| Callback de navegação (`onBack`, `onClose`) | Sim |
| Callback de sucesso (`onSave`, `onSuccess`) | Sim |
| Callback de atualização de estado local | Nao (usar useCallback no parent) |
| Funções do React Router (`navigate`, `setSearchParams`) | Nao (já são estáveis) |

#### Padrão Complementar: useCallback no Parent

Além do `useRef` no hook, o componente pai deve estabilizar seus callbacks:

```typescript
// MembersAreaLayout.tsx - Parent Component
const handleContentEditorBack = useCallback(() => {
  // Usar function form para evitar dependência de state
  setSearchParams((prev) => {
    const newParams = new URLSearchParams(prev);
    newParams.delete("mode");
    return newParams;
  });
}, [setSearchParams]); // setSearchParams é estável
```

### 7.2 Estabilização de Handlers com useCallback

#### Regra

Handlers que atualizam estado e são passados para componentes filhos devem usar `useCallback`:

```typescript
// CORRETO - Handler estável
const handleTitleChange = useCallback((value: string) => {
  setContent((prev) => ({ ...prev, title: value }));
}, []); // Array vazio - usa function form de setState

const handleAttachmentsChange = useCallback((newAttachments: Attachment[]) => {
  setAttachments(newAttachments);
}, []); // setAttachments de useState é estável por design
```

#### Anti-pattern

```typescript
// PROIBIDO - Handler inline recriado a cada render
<Input 
  onChange={(e) => setContent({ ...content, title: e.target.value })}
/>
```

---

## 8. Exceções Permitidas (Backend)
```

**Atualização 3:** Renumerar seção de exceções de 6 para 8 (manter conteúdo)

**Atualização 4:** Adicionar entrada no Changelog (final do arquivo)

```markdown
| 2026-01-27 | Adicionada Seção 7: React Patterns - useRef para callbacks, useCallback para handlers |
```

---

## Estrutura Final do Documento

| Seção | Título |
|-------|--------|
| 1 | Logging Centralizado |
| 2 | Padrões Proibidos |
| 3 | Lint Rules Ativas |
| 4 | Migração de Código Legado |
| 5 | Verificação de Conformidade |
| 6 | Exceções Permitidas (Backend) |
| **7** | **React Patterns** (NOVO) |

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Seção 7 presente | Presente com exemplos de codigo |
| Changelog atualizado | Entrada 2026-01-27 |
| Data do header | 2026-01-27 |
| Exemplos de codigo funcionais | Syntax highlighting correto |

---

## Conformidade RISE V3

| Criterio | Status |
|----------|--------|
| Documentação completa | 10/10 - Padrão documentado com exemplos |
| Zero ambiguidade | 10/10 - Regras claras de quando aplicar |
| Manutenibilidade | 10/10 - Futuros devs sabem o padrão |
| Arquitetura | 10/10 - Padrão reflete implementação real |

**NOTA FINAL: 10.0/10** - Documentação de padrão arquitetural conforme RISE Protocol V3.

