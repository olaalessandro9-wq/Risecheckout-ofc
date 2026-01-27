
# Plano de Correção: Pendências Finais para RISE V3 10.0/10

## Diagnóstico

A auditoria identificou **3 pendências críticas** que impedem a nota máxima:

1. **Frontend ignora prop `registrationSource`** - Afiliados são registrados como produtores
2. **Backend não mapeia `registration_source: "affiliate"`** - Origem incorreta no banco
3. **Documentação desatualizada** - Não explica o mapeamento de registration types

## Arquivos a Modificar

### 1. `src/components/auth/ProducerRegistrationForm.tsx`

**Linha 80 - Problema:**
```typescript
registrationType: "producer", // HARDCODED - ignora prop
```

**Correção:**
```typescript
// RISE V3: Map registrationSource prop to registrationType
registrationType: registrationSource,
```

### 2. `supabase/functions/unified-auth/handlers/register.ts`

**Linha 75 - Problema:**
```typescript
registration_source: registrationType === "producer" ? "organic" : "checkout",
```

**Correção:**
```typescript
// RISE V3: Map all registration types to their correct sources
registration_source: 
  registrationType === "producer" ? "organic" : 
  registrationType === "affiliate" ? "affiliate" : 
  "checkout",
```

### 3. `docs/UNIFIED_AUTH_SYSTEM.md`

**Adicionar nova seção após "Banco de Dados":**

```markdown
## Tipos de Registro

O sistema suporta 3 tipos de registro, cada um com mapeamento específico:

| registrationType | role atribuída | registration_source | activeRole inicial |
|------------------|----------------|---------------------|-------------------|
| `"producer"` | `seller` | `organic` | `seller` |
| `"affiliate"` | `seller` | `affiliate` | `seller` |
| `"buyer"` | (nenhuma) | `checkout` | `buyer` |

### Observações Importantes

1. **Origem vs Role:** A origem (`registration_source`) é apenas marcação interna para analytics.
   Não influencia permissões - ambos `producer` e `affiliate` recebem role `seller`.

2. **Frontend:** O formulário `/cadastro` envia `registrationType` baseado na escolha do quiz.

3. **Fallback no Login:** Usuários sem role em `user_roles` que tenham `registration_source`
   igual a `organic` ou `affiliate` recebem role `seller` automaticamente no primeiro login.
```

## Resultado Esperado

Após as correções:

```text
┌─────────────────────────────────────────────────────────────┐
│  FLUXO AFILIADO CORRIGIDO                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Quiz: Usuário seleciona "Quero ser afiliado"            │
│     → registrationSource = "affiliate"                       │
│                                                              │
│  2. ProducerRegistrationForm usa prop corretamente          │
│     → Envia registrationType: "affiliate"                   │
│                                                              │
│  3. register.ts mapeia origem corretamente                  │
│     → registration_source = "affiliate"                     │
│     → role = "seller"                                       │
│                                                              │
│  4. Login prioriza roles de produtor                        │
│     → activeRole = "seller"                                 │
│     → Redireciona para /dashboard                           │
│                                                              │
│  SCORE: RISE V3 10.0/10                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Validação Pós-Correção

1. Criar conta como AFILIADO via `/cadastro`
2. Verificar em `users` que `registration_source = "affiliate"`
3. Verificar em `user_roles` que `role = "seller"`
4. Login deve redirecionar para `/dashboard`
5. Menu deve mostrar opção de trocar contexto

## Ordem de Deploy

1. Deploy Edge Function `unified-auth` (register.ts)
2. Deploy Frontend (ProducerRegistrationForm.tsx)
3. Atualizar documentação

## Seção Técnica

### Mapeamento Final Documentado

```typescript
// Interface
interface RegisterRequest {
  registrationType?: "producer" | "affiliate" | "buyer";
}

// Mapeamento no Backend
const registration_source = 
  registrationType === "producer" ? "organic" : 
  registrationType === "affiliate" ? "affiliate" : 
  "checkout";

// Role atribuída
const role = (registrationType === "producer" || registrationType === "affiliate") 
  ? "seller" 
  : null;
```

### Comentários Atualizados

```typescript
// register.ts - Comentário atualizado
// RISE V3: Cadastro via /cadastro = sempre recebe role "seller"
// Origem (producer/affiliate) é apenas marcação interna para analytics
// - producer → registration_source: "organic"
// - affiliate → registration_source: "affiliate"
// Ambos recebem a mesma role: "seller"
```
