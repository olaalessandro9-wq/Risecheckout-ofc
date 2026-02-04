
# Plano: Botão "Validar Credenciais" UTMify

## Objetivo
Criar um componente `ValidateCredentialsButton` na tela de configurações UTMify que:
1. Chama a Edge Function `utmify-validate-credentials`
2. Exibe resultado detalhado com fingerprint, eventos habilitados e status do teste de API
3. Segue RISE Protocol V3 (Single Responsibility, zero console.log, Clean Architecture)

---

## Análise de Soluções

### Solução A: Componente Inline no UTMifyForm
- Manutenibilidade: 6/10 (polui o componente form)
- Zero DT: 6/10 (mistura responsabilidades)
- Arquitetura: 5/10 (viola Single Responsibility)
- Escalabilidade: 6/10 (difícil reutilizar)
- Segurança: 10/10
- **NOTA FINAL: 6.6/10**

### Solução B: Componente Separado `ValidateCredentialsButton`
- Manutenibilidade: 10/10 (isolado, testável)
- Zero DT: 10/10 (implementação completa)
- Arquitetura: 10/10 (Single Responsibility perfeito)
- Escalabilidade: 10/10 (reutilizável)
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução B (Nota 10.0)
Componente separado seguindo o padrão dos outros componentes (`TokenInput`, `EventSelector`, `ProductSelector`).

---

## Arquitetura Proposta

```text
src/modules/utmify/components/
├── ValidateCredentialsButton.tsx  [NOVO]
├── TokenInput.tsx
├── ProductSelector.tsx
├── EventSelector.tsx
├── UTMifyForm.tsx                 [MODIFICAR - adicionar import]
└── index.ts                       [MODIFICAR - adicionar export]
```

---

## Detalhes Técnicos

### 1. Novo Componente: `ValidateCredentialsButton.tsx`

**Responsabilidades:**
- Chamar `utmify-validate-credentials` via `api.call()`
- Gerenciar estados: idle → loading → success/error
- Exibir resultado em modal/dialog com todos os detalhes

**Interface de retorno esperada (da Edge Function):**
```typescript
interface ValidateResponse {
  valid: boolean;
  message: string;
  details: {
    fingerprint: string | null;
    tokenLength: number;
    normalizationApplied: boolean;
    normalizationChanges: string[];
    apiTest: {
      performed: boolean;
      statusCode?: number;
      response?: string;
    };
    configStatus: {
      hasToken: boolean;
      eventsEnabled: string[];
    };
  };
}
```

**Componentes UI utilizados:**
- `Button` com ícone de verificação
- `Dialog` para exibir resultados detalhados
- `Badge` para status (válido/inválido)
- `Separator` para organizar seções
- Ícones: `ShieldCheck`, `ShieldX`, `Loader2`

**Estados visuais:**
1. **Idle**: Botão "Validar Credenciais" com ícone ShieldCheck
2. **Loading**: Botão desabilitado com Loader2 girando
3. **Success (válido)**: Dialog verde com todos os detalhes
4. **Error (inválido)**: Dialog vermelho com diagnóstico

### 2. Integração no UTMifyForm

O botão será posicionado após o `TokenInput`, criando um fluxo natural:
1. Usuário insere/atualiza token
2. Clica em "Validar Credenciais" para testar
3. Recebe diagnóstico completo
4. Salva configuração

### 3. Uso do API Client

```typescript
const { data, error } = await api.call<ValidateResponse>(
  "utmify-validate-credentials",
  { vendorId: user.id }
);
```

A autenticação é automática via cookies httpOnly enviados pelo `api.call()`.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/modules/utmify/components/ValidateCredentialsButton.tsx` | CRIAR | Componente principal (~120 linhas) |
| `src/modules/utmify/components/index.ts` | MODIFICAR | Adicionar export |
| `src/modules/utmify/components/UTMifyForm.tsx` | MODIFICAR | Adicionar componente após TokenInput |

---

## Detalhes do Dialog de Resultado

O dialog exibirá as seguintes seções:

1. **Header**
   - Ícone: ShieldCheck (verde) ou ShieldX (vermelho)
   - Título: "Credenciais Válidas" ou "Credenciais Inválidas"
   - Mensagem descritiva

2. **Seção: Token**
   - Fingerprint (SHA-256 12 chars)
   - Tamanho do token
   - Normalização aplicada (sim/não)
   - Mudanças de normalização (se houver)

3. **Seção: Teste de API**
   - Status HTTP
   - Resposta (truncada se muito longa)

4. **Seção: Configuração**
   - Eventos habilitados (lista com badges)

---

## Fluxo de Execução

```text
┌────────────────────────────────────────────────────────────────┐
│  1. Usuário clica em "Validar Credenciais"                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  2. Estado muda para "loading"                                  │
│     - Botão desabilitado                                        │
│     - Loader2 animando                                          │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  3. Chamada: api.call("utmify-validate-credentials")           │
│     - Cookies httpOnly enviados automaticamente                │
│     - vendorId do useUnifiedAuth().user.id                     │
└────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│  4a. Sucesso            │    │  4b. Erro                       │
│  - valid: true/false    │    │  - error object                 │
│  - details preenchidos  │    │  - Exibir toast de erro         │
└─────────────────────────┘    └─────────────────────────────────┘
              │                               │
              ▼                               ▼
┌────────────────────────────────────────────────────────────────┐
│  5. Abrir Dialog com resultado detalhado                       │
│     - Todas as seções do diagnóstico                           │
│     - Botão "Fechar"                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## Dependências

Todas já estão instaladas no projeto:
- `@radix-ui/react-dialog` (componente Dialog)
- `lucide-react` (ícones ShieldCheck, ShieldX, Loader2)
- `@/components/ui/*` (shadcn components)
- `@/lib/api` (api.call)
- `@/hooks/useUnifiedAuth` (user.id)

---

## Validações de Segurança

- O botão só aparece se `hasExistingToken` for true (via context)
- A Edge Function valida ownership (`user.id === vendorId`)
- Token nunca exposto - apenas fingerprint exibido
- Chamada autenticada via cookies httpOnly
