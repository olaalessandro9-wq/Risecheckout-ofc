
# Plano: Validação de Token UTMify - Exatamente 36 Caracteres

## Diagnóstico

O token UTMify tem tamanho fixo de **36 caracteres** (exemplo: `A7KU9Mgyb4ihqg0R5Ybh4wbURToU3cU8tt93`). A Cakto já implementa essa validação conforme o screenshot, exibindo mensagem de erro clara quando o tamanho não é exato.

Atualmente, o sistema RiseCheckout apenas valida se o token é "muito curto" (< 10 chars) no backend, mas não impõe o tamanho exato de 36.

---

## Análise de Soluções

### Solução A: Validação apenas no Frontend (TokenInput)
- Manutenibilidade: 7/10 (validação pode ser burlada via API)
- Zero DT: 6/10 (inconsistência frontend/backend)
- Arquitetura: 6/10 (segurança dependente de UI)
- Escalabilidade: 7/10 (funciona, mas frágil)
- Segurança: 5/10 (cliente pode enviar qualquer coisa)
- **NOTA FINAL: 6.2/10**

### Solução B: Validação apenas no Backend (vault-save)
- Manutenibilidade: 8/10 (centralizado, mas UX ruim)
- Zero DT: 9/10 (backend é SSOT)
- Arquitetura: 8/10 (correto, mas feedback tardio)
- Escalabilidade: 9/10 (funciona)
- Segurança: 10/10 (proteção server-side)
- **NOTA FINAL: 8.8/10**

### Solução C: Validação em 3 Camadas (Frontend + Context + Backend)
- Manutenibilidade: 10/10 (constante centralizada, validação em todos os níveis)
- Zero DT: 10/10 (implementação completa)
- Arquitetura: 10/10 (Single Source of Truth para a constante, feedback imediato + proteção)
- Escalabilidade: 10/10 (constante exportada para fácil ajuste futuro)
- Segurança: 10/10 (triple check)
- **NOTA FINAL: 10.0/10**

### DECISÃO: Solução C (Nota 10.0)
Validação em 3 camadas garante UX excelente (feedback instantâneo) + segurança (backend não aceita tokens inválidos).

---

## Arquitetura Proposta

```text
src/modules/utmify/constants/
├── events.ts
├── token.ts              [NOVO - constante TOKEN_LENGTH]
└── index.ts              [MODIFICAR - exportar constante]

src/modules/utmify/components/
├── TokenInput.tsx        [MODIFICAR - validação visual]
└── ...

src/modules/utmify/context/
└── UTMifyContext.tsx     [MODIFICAR - validação no save]

supabase/functions/
├── vault-save/index.ts   [MODIFICAR - validação server-side]
└── _shared/utmify/
    ├── token-normalizer.ts  [MODIFICAR - adicionar validação de tamanho]
    └── constants.ts      [MODIFICAR - adicionar TOKEN_LENGTH]
```

---

## Detalhes de Implementação

### 1. Nova Constante: `src/modules/utmify/constants/token.ts`

```typescript
/**
 * Tamanho exato do token UTMify (36 caracteres)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */
export const UTMIFY_TOKEN_LENGTH = 36;

export const UTMIFY_TOKEN_ERROR_MESSAGE = 
  "Token API inválido. Deve conter exatamente 36 caracteres.";
```

### 2. Modificar: `TokenInput.tsx`

Adicionar validação visual em tempo real:
- Se token.length > 0 && token.length !== 36: mostrar erro
- Contador de caracteres (ex: "32/36")
- Borda vermelha quando inválido
- Mensagem de erro abaixo do input

```typescript
// Lógica de validação
const isTokenLengthValid = token.length === 0 || token.length === UTMIFY_TOKEN_LENGTH;
const showError = token.length > 0 && !isTokenLengthValid;
```

### 3. Modificar: `UTMifyContext.tsx` (save handler)

Adicionar validação antes de disparar o evento SAVE:

```typescript
// No save():
if (token.trim() && token.trim().length !== UTMIFY_TOKEN_LENGTH) {
  toast.error(UTMIFY_TOKEN_ERROR_MESSAGE);
  return;
}
```

### 4. Modificar: `vault-save/index.ts` (backend)

Alterar validação existente (linhas 195-200):

```typescript
// ANTES: apenas "muito curto"
if (result.normalized.length < 10) {
  return ... 'Token UTMify parece inválido (muito curto)'

// DEPOIS: exatamente 36
if (result.normalized.length !== 36) {
  return ... 'Token UTMify inválido. Deve conter exatamente 36 caracteres.'
```

### 5. Modificar: `_shared/utmify/constants.ts` (backend SSOT)

Adicionar constante para manter consistência:

```typescript
export const UTMIFY_TOKEN_LENGTH = 36;
```

---

## Interface Visual (TokenInput Modificado)

```
┌─────────────────────────────────────────────────────────────────┐
│  API Token (já configurado)                                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ lUDu0mzMbURWqgdtyva60EMeTJROqRBLtTIt                    │    │  ← Borda verde (36 chars OK)
│  └─────────────────────────────────────────────────────────┘    │
│  ✓ 36/36 caracteres                                             │  ← Contador verde
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  API Token                                                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ lUDu0mzMbURWqgdtyva60EMeTJROqRBL                        │    │  ← Borda vermelha (32 chars)
│  └─────────────────────────────────────────────────────────┘    │
│  ✗ 32/36 caracteres - Token deve ter exatamente 36 caracteres  │  ← Erro vermelho
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/modules/utmify/constants/token.ts` | CRIAR | Constante UTMIFY_TOKEN_LENGTH + mensagem |
| `src/modules/utmify/constants/index.ts` | MODIFICAR | Exportar token.ts |
| `src/modules/utmify/components/TokenInput.tsx` | MODIFICAR | Validação visual + contador |
| `src/modules/utmify/context/UTMifyContext.tsx` | MODIFICAR | Validação no save() |
| `supabase/functions/vault-save/index.ts` | MODIFICAR | Validação exata 36 chars |
| `supabase/functions/_shared/utmify/constants.ts` | MODIFICAR | Adicionar TOKEN_LENGTH |

---

## Fluxo de Validação

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. Usuário digita token no TokenInput                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. FRONTEND: Validação instantânea (UI)                        │
│     - Contador: X/36 caracteres                                  │
│     - Borda verde (OK) ou vermelha (erro)                       │
│     - Mensagem de erro se length !== 36                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Usuário clica "Salvar Configuração"                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. CONTEXT: Validação no save()                                 │
│     - Se token.length !== 36 → toast.error() → BLOQUEIA         │
│     - Se OK → envia evento SAVE                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. BACKEND: vault-save valida                                   │
│     - Normaliza token (remove chars invisíveis)                  │
│     - Se normalized.length !== 36 → HTTP 400                     │
│     - Se OK → salva no Vault                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **UX Excelente**: Feedback instantâneo enquanto digita
2. **Consistência**: Mesmo comportamento da Cakto (referência do screenshot)
3. **Segurança**: Triple check (UI → Context → Backend)
4. **Manutenibilidade**: Constante UTMIFY_TOKEN_LENGTH = 36 centralizada (fácil ajustar se mudar)
5. **Prevenção de Erros**: Impede tokens parcialmente copiados ou com caracteres extras
