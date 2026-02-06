

# Fix: Persistir Atualizacao de Modulos no Builder

## O que muda

Uma unica funcao: `updateModule` no arquivo `useMembersAreaState.ts` (linhas 223-225). Atualmente ela so atualiza o estado local (XState). Apos a correcao, ela primeiro persiste no banco via Edge Function e so depois atualiza o estado local.

## Comportamento que se MANTEM (como voce quer)

- Salvar no builder (modal "Editar Modulo") persiste diretamente no banco -- nao depende do botao "Salvar" do topo
- Salvar em "Conteudos" salva no banco via API independente
- Secoes EXISTENTES no builder nao atualizam automaticamente ao alterar em "Conteudos"
- NOVAS secoes pegam dados atualizados do contexto

## Detalhes Tecnicos

### Arquivo: `src/modules/members-area-builder/hooks/useMembersAreaState.ts`

**1. Adicionar import do `api` (linha 12):**

```text
import { api } from "@/lib/api";
```

**2. Reescrever `updateModule` (linhas 223-225):**

```text
// ANTES:
const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    send({ type: 'UPDATE_MODULE', id, data });
}, [send]);

// DEPOIS:
const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    const { error } = await api.call<{ success: boolean; error?: string }>('members-area-modules', {
      action: 'update',
      moduleId: id,
      data,
    });

    if (error) {
      toast.error("Erro ao atualizar modulo");
      return;
    }

    send({ type: 'UPDATE_MODULE', id, data });
}, [send]);
```

Isso garante:
1. A imagem (e qualquer outro dado do modulo) e persistida no banco via Edge Function
2. O estado local XState so e atualizado apos confirmacao do backend
3. Se a API falhar, o estado local NAO e atualizado (consistencia) e um toast de erro aparece

Nenhum outro arquivo precisa ser alterado. A Edge Function `handleUpdateModule` ja suporta o campo `cover_image_url` corretamente.

