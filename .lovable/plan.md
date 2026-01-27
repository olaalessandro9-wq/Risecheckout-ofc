
# Plano: Corrigir Loop Infinito na Seção de Anexos do Content Editor

## RISE Protocol V3 - Análise de Soluções

### Solução A: Adicionar useCallback apenas no Layout
- Manutenibilidade: 6/10 (resolve o problema superficialmente, mas a arquitetura do hook ainda é frágil)
- Zero DT: 5/10 (qualquer novo callback passado ao hook pode causar o mesmo problema)
- Arquitetura: 4/10 (o hook não deveria depender de callbacks externos para funcionar corretamente)
- Escalabilidade: 5/10 (outros componentes que usem este hook podem ter o mesmo problema)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 5.6/10**
- Tempo estimado: 15 minutos

### Solução B: Remover onBack das dependências do useCallback no hook + Stabilizar callbacks no Layout
- Manutenibilidade: 8/10 (resolve o problema em dois pontos, mas ainda mantém callback como prop)
- Zero DT: 7/10 (melhora, mas o padrão ainda é frágil)
- Arquitetura: 6/10 (useCallback com array de dependências parcial é anti-pattern)
- Escalabilidade: 7/10 (melhor, mas não elimina completamente o risco)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 7.4/10**
- Tempo estimado: 30 minutos

### Solução C: Refatoração Arquitetural Completa - Separar loading inicial de callbacks de ação
- Manutenibilidade: 10/10 (separação clara entre data fetching e ações)
- Zero DT: 10/10 (callbacks de ação NUNCA influenciam o carregamento de dados)
- Arquitetura: 10/10 (segue SOLID - Single Responsibility)
- Escalabilidade: 10/10 (padrão seguro para qualquer expansão futura)
- Segurança: 10/10 (sem impacto)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 45 minutos

### DECISÃO: Solução C (10.0/10)

As soluções A e B são inferiores porque tratam sintomas sem resolver a causa arquitetural. A Solução C implementa o princípio correto: **callbacks de ação (onBack, onSave) jamais devem influenciar o ciclo de vida do data fetching**.

---

## Diagnóstico Root Cause (RISE V3)

### Problema Identificado

O hook `useContentEditorData` inclui `onBack` no array de dependências do `useCallback`:

```typescript
// useContentEditorData.ts - Linha 148
const loadData = useCallback(async () => {
  // ...
  onBack(); // Usado apenas em caso de erro
}, [isNew, contentId, moduleId, onBack]); // ⚠️ onBack causa re-criação de loadData

useEffect(() => {
  loadData();
}, [loadData]); // ⚠️ Executa a cada mudança de loadData
```

### Cadeia de Eventos (Loop Infinito)

```text
1. ContentEditorView renderiza
       ↓
2. useContentEditorData recebe nova ref de onBack
       ↓
3. loadData é recriado (nova ref de função)
       ↓
4. useEffect detecta mudança em loadData
       ↓
5. loadData() é executado → setIsLoading(true)
       ↓
6. Re-render acontece → volta ao passo 1
       ↓
   ∞ LOOP INFINITO
```

### Trigger do Bug

Quando o usuário interage com o input de arquivo:
1. `onChange` é chamado no input
2. `handleAttachmentsChange` atualiza o estado `attachments`
3. Re-render do ContentEditorView
4. Novo `onBack` é criado (função inline no MembersAreaLayout)
5. useContentEditorData detecta nova referência
6. Loop infinito inicia

---

## Fases de Execução

### Fase 1: Estabilizar `onBack` no MembersAreaLayout

**Arquivo:** `src/modules/members-area/layouts/MembersAreaLayout.tsx`

Converter `handleContentEditorBack` para `useCallback` com dependências corretas:

```typescript
const handleContentEditorBack = useCallback(() => {
  // Usar function form do setSearchParams para evitar dependência de searchParams
  setSearchParams((prev) => {
    const newParams = new URLSearchParams(prev);
    newParams.delete("mode");
    newParams.delete("contentId");
    newParams.delete("moduleId");
    return newParams;
  });
}, [setSearchParams]); // setSearchParams é estável por design do React Router
```

**Também converter `handleContentEditorSave`:**

```typescript
const handleContentEditorSave = useCallback(async () => {
  await membersArea.fetchModules();
  // Usar setSearchParams diretamente
  setSearchParams((prev) => {
    const newParams = new URLSearchParams(prev);
    newParams.delete("mode");
    newParams.delete("contentId");
    newParams.delete("moduleId");
    return newParams;
  });
}, [membersArea, setSearchParams]);
```

### Fase 2: Refatorar useContentEditorData - Separar data loading de error handling

**Arquivo:** `src/modules/members-area/hooks/useContentEditorData.ts`

A arquitetura correta é: **onBack não deve ser dependência de loadData**. Callbacks de navegação/ação devem ser chamados de forma isolada, não dentro do ciclo de data fetching.

**Mudança 1: Usar useRef para onBack (estabilizar referência)**

```typescript
import { useState, useEffect, useCallback, useRef } from "react";

export function useContentEditorData({
  isNew,
  contentId,
  moduleId,
  onBack,
}: UseContentEditorDataProps): UseContentEditorDataReturn {
  // RISE V3: Usar ref para callbacks que não devem influenciar o ciclo de vida
  const onBackRef = useRef(onBack);
  
  // Manter ref atualizada
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);
  
  // ... estados
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.call<ContentEditorDataResponse>("admin-data", {
        action: "content-editor-data",
        contentId,
        moduleId,
        isNew,
      });

      if (error) {
        log.error("Error loading content:", error);
        toast.error("Erro ao carregar conteúdo");
        // RISE V3: Usar ref para callback - não afeta dependências
        onBackRef.current();
        return;
      }
      
      // ... resto da lógica
    } catch (err) {
      log.error("Exception:", err);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setIsLoading(false);
    }
  }, [isNew, contentId, moduleId]); // ✅ onBack REMOVIDO das dependências

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // ...
}
```

### Fase 3: Estabilizar handlers no ContentEditorView

**Arquivo:** `src/modules/members-area/views/ContentEditorView.tsx`

Converter handlers inline para `useCallback` para evitar re-renders desnecessários:

```typescript
const handleAttachmentsChange = useCallback((newAttachments: ContentAttachment[]) => {
  setAttachments(newAttachments);
}, [setAttachments]); // setAttachments é estável (useState)

// Demais handlers que já usam pattern funcional estão OK, mas por consistência:
const handleTitleChange = useCallback((value: string) => {
  setContent((prev) => ({ ...prev, title: value }));
}, []);

const handleVideoUrlChange = useCallback((value: string | null) => {
  setContent((prev) => ({ ...prev, video_url: value }));
}, []);

const handleBodyChange = useCallback((value: string) => {
  setContent((prev) => ({ ...prev, body: value || null }));
}, []);

const handleReleaseChange = useCallback((settings: ReleaseFormData) => {
  setRelease(settings);
}, []);
```

---

## Arquivos a Modificar (3 arquivos)

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/members-area/layouts/MembersAreaLayout.tsx` | Estabilizar callbacks com useCallback + function form de setSearchParams |
| `src/modules/members-area/hooks/useContentEditorData.ts` | Usar useRef para onBack, remover de dependências |
| `src/modules/members-area/views/ContentEditorView.tsx` | Estabilizar handlers com useCallback |

---

## Validação Pós-Implementação

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Adicionar anexo via input | ✅ Arquivo aparece na lista sem refresh |
| Cancelar diálogo de anexo | ✅ Sem refresh, dados preservados |
| Editar título + adicionar anexo | ✅ Ambas alterações preservadas |
| Salvar conteúdo com anexos | ✅ Todos os dados salvos corretamente |
| Console sem warnings | ✅ Zero loops, zero warnings |

---

## Conformidade RISE V3

| Critério | Status |
|----------|--------|
| Root Cause Only | ✅ Resolve a causa raiz (referências instáveis de callback) |
| Zero Dívida Técnica | ✅ Padrão useRef para callbacks é best practice React |
| Arquitetura Correta | ✅ Separação clara: data fetching não depende de action callbacks |
| Escalabilidade | ✅ Padrão aplicável a qualquer hook similar |
| Segurança | ✅ Sem impacto |
| < 300 linhas | ✅ Todos os arquivos permanecem compactos |

**NOTA FINAL: 10.0/10** - Refatoração arquitetural seguindo RISE Protocol V3.
