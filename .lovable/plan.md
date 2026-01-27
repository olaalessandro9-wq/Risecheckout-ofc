
# Plano de Correção de Pendências - Categoria A (Autenticação)

## Sumário Executivo

Após análise completa do código, identifiquei **3 pendências reais** que precisam ser corrigidas, todas relacionadas a fallbacks para a tabela legada `buyer_profiles`. O objetivo é eliminar 100% das referências a essa tabela nos handlers de autenticação, consolidando `users` como a única fonte de verdade (SSOT).

---

## Estado Atual vs. Desejado

```text
┌─────────────────────────────────────────────────────────────┐
│                    ESTADO ATUAL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  password-reset-request.ts   → users ONLY ✅                │
│  password-reset-verify.ts    → users + buyer_profiles ❌    │
│  password-reset.ts           → users + buyer_profiles ❌    │
│  ensure-producer-access.ts   → users + buyer_profiles ❌    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ESTADO DESEJADO                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  password-reset-request.ts   → users ONLY ✅                │
│  password-reset-verify.ts    → users ONLY ✅                │
│  password-reset.ts           → users ONLY ✅                │
│  ensure-producer-access.ts   → users ONLY ✅                │
│                                                              │
│  Zero fallbacks legados. Zero buyer_profiles nos handlers.  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Análise de Dados - Risco de Migração

Executei queries no banco para avaliar o risco:

| Métrica | Valor | Risco |
|---------|-------|-------|
| Total de buyers em `buyer_profiles` | 5 | Muito baixo |
| Buyers com reset_token ativo | 0 | Zero |
| Buyers não migrados para `users` | 0 | Zero |

**Conclusão:** Não há risco de perda de dados. Todos os buyers já estão sincronizados com a tabela `users`. Os fallbacks podem ser removidos com segurança.

---

## Pendências a Corrigir

### A8: `password-reset-verify.ts` (Linhas 50-88)

**Problema:** Fallback para `buyer_profiles` quando token não encontrado em `users`.

**Código Atual:**
```typescript
// RISE V3 FALLBACK: If not found in users, check buyer_profiles
if (findError || !user) {
  const { data: buyer, error: buyerError } = await supabase
    .from("buyer_profiles")  // ← FALLBACK PARA TABELA LEGADA
    .select("id, email, name, reset_token_expires_at")
    .eq("reset_token", token)
    .single();
  // ... 40 linhas de código duplicado ...
}
```

**Correção:** Remover todo o bloco de fallback (linhas 50-88). Se o token não for encontrado em `users`, retornar "Token inválido" diretamente.

**Código Corrigido:**
```typescript
// Find user by reset token in unified users table (SSOT)
const { data: user, error: findError } = await supabase
  .from("users")
  .select("id, email, name, reset_token_expires_at")
  .eq("reset_token", token)
  .single();

// RISE V3: users is the only SSOT - no fallbacks
if (findError || !user) {
  log.debug("Reset token not found in users table");
  return jsonResponse({ 
    valid: false, 
    error: "Token inválido" 
  }, corsHeaders);
}

// Rest of the logic continues...
```

---

### A9: `password-reset.ts` (Linhas 66-151)

**Problema:** Fallback para `buyer_profiles` + lógica duplicada de migração para `users`.

**Código Atual:**
```typescript
// RISE V3 FALLBACK: If not found in users, check buyer_profiles
if (findError || !user) {
  const { data: buyer, error: buyerError } = await supabase
    .from("buyer_profiles")  // ← FALLBACK
    .select(...)
  
  // ... 85 linhas de código duplicado incluindo:
  // - Validação de expiração
  // - Hash de senha
  // - Update em buyer_profiles
  // - Criação/update em users (migração)
  // - Audit log separado
}
```

**Correção:** Remover todo o bloco de fallback (linhas 66-151). A lógica de reset deve operar APENAS na tabela `users`.

**Justificativa:** Como `password-reset-request.ts` já opera APENAS em `users`, qualquer token gerado estará APENAS na tabela `users`. Portanto, não há necessidade de verificar `buyer_profiles`.

---

### A10: `ensure-producer-access.ts` (Linhas 43-48, 51, 87)

**Problema:** Fallback para `buyer_profiles` ao verificar se usuário existe.

**Código Atual:**
```typescript
// Check if user exists in unified users table
let { data: user } = await supabase
  .from("users")
  .select("id")
  .eq("email", normalizedEmail)
  .single();

// If not in users table, check fallback buyer_profiles
let { data: buyer } = await supabase
  .from("buyer_profiles")  // ← FALLBACK
  .select("id")
  .eq("email", normalizedEmail)
  .single();

// ... usa buyer?.id como fallback
const userId = user?.id || buyer?.id;
```

**Correção:** Remover a query para `buyer_profiles`. Se o usuário não existir em `users`, criar diretamente em `users`.

---

## Plano de Implementação

### Fase 1: Corrigir `password-reset-verify.ts`

1. Remover linhas 50-88 (bloco de fallback completo)
2. Simplificar para retornar erro quando token não encontrado em `users`
3. Remover `source: "buyer_profiles"` do retorno

**Arquivo Final:** ~70 linhas (atualmente 123 linhas) - Redução de 43%

---

### Fase 2: Corrigir `password-reset.ts`

1. Remover linhas 66-151 (bloco de fallback completo)
2. Manter apenas a lógica para tabela `users`
3. Remover import não utilizado (se houver)

**Arquivo Final:** ~125 linhas (atualmente 212 linhas) - Redução de 41%

---

### Fase 3: Corrigir `ensure-producer-access.ts`

1. Remover linhas 43-48 (query para `buyer_profiles`)
2. Remover linha 87 (`|| buyer?.id`)
3. Simplificar lógica para criar em `users` diretamente se não existir

**Arquivo Final:** ~70 linhas (atualmente 98 linhas) - Redução de 29%

---

### Fase 4: Atualizar Documentação

Atualizar `docs/EDGE_FUNCTIONS_REGISTRY.md` e `docs/UNIFIED_AUTH_SYSTEM.md` para refletir que **100% dos handlers de autenticação operam APENAS na tabela `users`**.

---

## Análise de Soluções (RISE V3 Obrigatório)

### Solução A: Remoção Direta de Fallbacks

Remove todos os fallbacks para `buyer_profiles` sem migração adicional.

- Manutenibilidade: 10/10 (código 40% menor)
- Zero DT: 10/10 (elimina código morto)
- Arquitetura: 10/10 (SSOT puro)
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 1-2 horas

### Solução B: Migração Automática + Remoção de Fallbacks

Primeiro migra dados, depois remove fallbacks.

- Manutenibilidade: 10/10
- Zero DT: 10/10
- Arquitetura: 10/10
- Escalabilidade: 10/10
- Segurança: 10/10
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2-3 horas (inclui migração desnecessária)

### DECISÃO: Solução A

Como a análise de dados mostrou que **0 buyers têm tokens ativos** e **0 buyers não estão migrados**, a Solução B é trabalho desnecessário. A Solução A é suficiente e mais eficiente.

---

## Arquivos a Modificar

| Arquivo | Ação | Linhas Removidas | Resultado |
|---------|------|------------------|-----------|
| `password-reset-verify.ts` | Remover fallback | 38 linhas | 100% SSOT |
| `password-reset.ts` | Remover fallback | 85 linhas | 100% SSOT |
| `ensure-producer-access.ts` | Remover fallback | 10 linhas | 100% SSOT |
| `EDGE_FUNCTIONS_REGISTRY.md` | Atualizar status | N/A | Documentação |
| `UNIFIED_AUTH_SYSTEM.md` | Atualizar status | N/A | Documentação |

---

## Resultado Final Esperado

```text
┌─────────────────────────────────────────────────────────────┐
│  AUDITORIA CATEGORIA A - PÓS CORREÇÃO                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  A1: Third-party cookies    → By Design (multi-subdomínio)  │
│  A2: Refresh em idle        → ✅ CORRIGIDO (Validate-First) │
│  A3: validateSession        → ✅ CORRIGIDO (Backend SSOT)   │
│  A4: Duas anon keys         → ✅ CORRIGIDO (Stub seguro)    │
│  A5: Supabase localStorage  → ✅ CORRIGIDO (Bloqueado)      │
│  A6: CrossTabLock           → ✅ Mitigado (Server Lock)     │
│  A7: Persistence            → ✅ Mitigado (Server Lock)     │
│  A8: password-reset-verify  → A CORRIGIR NESTE PLANO        │
│  A9: password-reset         → A CORRIGIR NESTE PLANO        │
│  A10: ensure-producer-access→ A CORRIGIR NESTE PLANO        │
│  A14: hasValidToken idle    → ✅ CORRIGIDO (Validate-First) │
│  A15: restoreState          → ✅ Mitigado (Backend SSOT)    │
│  A16: handleVisibility      → ✅ Mitigado (Backend SSOT)    │
│                                                              │
│  RESULTADO: 100% COMPLIANT (Após execução deste plano)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Código 35% Menor:** Remoção de ~133 linhas de código morto
2. **SSOT Absoluto:** `users` é a única fonte de verdade
3. **Zero Confusão:** Desenvolvedores não precisam considerar `buyer_profiles`
4. **Manutenção Simplificada:** Um único caminho de código
5. **RISE V3 10.0/10:** Compliance total com o protocolo
