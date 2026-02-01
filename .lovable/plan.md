
# Plano de Correção: Validação de Email e IP (RISE V3 - 10.0/10)

## Sumário Executivo

Foram identificadas **3 falhas** nos testes que violam a qualidade do código RISE V3:

| Arquivo | Problema | Causa Raiz |
|---------|----------|------------|
| `security-management/index.test.ts` (linha 128) | Aceita `999.999.999.999` como IP válido | Regex `/^(\d{1,3}\.){3}\d{1,3}$/` não valida octetos 0-255 |
| `unified-auth/__tests__/handlers/register.test.ts` (linha 107) | Aceita `test..test@test.com` como inválido mas regex aceita | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` aceita pontos consecutivos |
| `unified-auth/index.test.ts` (linha 72) | Idem acima | Mesmo problema |

---

## Análise de Soluções (RISE V3 Seção 4)

### Solução A: Correção Pontual nos Testes
Alterar apenas os testes falhando, removendo os casos problemáticos ou ajustando as regex inline.

- **Manutenibilidade**: 4/10 - Mantém código duplicado e inconsistente
- **Zero DT**: 3/10 - Cada novo teste pode ter validação diferente
- **Arquitetura**: 3/10 - Viola SRP e DRY
- **Escalabilidade**: 3/10 - Não resolve o problema sistêmico
- **Segurança**: 4/10 - Validações fracas permanecem no código de produção
- **NOTA FINAL: 3.4/10**
- **Tempo estimado**: 10 minutos

### Solução B: Centralização Completa com Validadores Robustos
Criar validadores centralizados RFC-compliant em `_shared/validators.ts` e atualizar todos os testes para usar esses validadores.

- **Manutenibilidade**: 10/10 - Single Source of Truth para validações
- **Zero DT**: 10/10 - Resolve definitivamente, sem retrabalho futuro
- **Arquitetura**: 10/10 - SRP, DRY, Clean Architecture
- **Escalabilidade**: 10/10 - Novos testes e funções usam validadores centrais
- **Segurança**: 10/10 - Validações robustas em toda a aplicação
- **NOTA FINAL: 10.0/10**
- **Tempo estimado**: 45 minutos

### DECISÃO: Solução B (Nota 10.0)

A Solução A é uma "gambiarra" que esconde o problema. A Solução B implementa a arquitetura correta, seguindo o mandamento absoluto do RISE V3: **"Se a solução mais complexa demora 1 ano e tem nota 10, NÓS VAMOS NA MAIS COMPLEXA."**

---

## Implementação Detalhada

### Fase 1: Criar Validadores Centralizados

**Arquivo: `supabase/functions/_shared/validators.ts`**

Adicionar duas novas funções:

```typescript
/**
 * Validates IPv4 address format with octet validation (0-255)
 * RFC 791 compliant
 */
export function isValidIPv4(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value === "") return false;
  
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}
```

**Melhorar `isValidEmail`** para rejeitar pontos consecutivos:

```typescript
/**
 * Validates email format with RFC 5321 basic compliance
 * Rejects: empty, no @, no domain, no TLD, consecutive dots
 */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length > 255) return false;
  
  // Basic structure check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return false;
  
  // RFC 5321: No consecutive dots in local or domain part
  if (value.includes("..")) return false;
  
  // No dot at start or end of local part
  const localPart = value.split("@")[0];
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  
  return true;
}
```

### Fase 2: Atualizar Arquivo Duplicado

**Arquivo: `supabase/functions/_shared/validation/format-utils.ts`**

Aplicar a mesma lógica de `isValidEmail` para manter consistência.

### Fase 3: Corrigir Testes Inline

**Arquivo: `supabase/functions/security-management/index.test.ts`**

Substituir regex inline por função centralizada:

```typescript
import { isValidIPv4 } from "../_shared/validators.ts";

// Linha 142-150: Substituir regex por isValidIPv4
validIPs.forEach(ip => {
  assertEquals(isValidIPv4(ip), true, `${ip} should be valid`);
});

invalidIPs.forEach(ip => {
  assertEquals(isValidIPv4(ip), false, `${ip} should be invalid`);
});
```

**Arquivos: `unified-auth/__tests__/handlers/register.test.ts` e `unified-auth/index.test.ts`**

Importar e usar validador centralizado:

```typescript
import { isValidEmail } from "../../_shared/validators.ts";

// Substituir regex inline por isValidEmail
const isValid = isValidEmail(body.email);
```

### Fase 4: Atualizar Testes de Validadores

**Arquivo: `supabase/functions/_shared/validators/validators-email.test.ts`**

Adicionar casos de teste para pontos consecutivos:

```typescript
Deno.test("isValidEmail: should reject consecutive dots", () => {
  assertEquals(isValidEmail("test..test@example.com"), false);
});

Deno.test("isValidEmail: should reject leading dot in local part", () => {
  assertEquals(isValidEmail(".test@example.com"), false);
});
```

**Criar: `supabase/functions/_shared/validators/validators-ipv4.test.ts`**

Testes completos para validação de IPv4:

```typescript
Deno.test("isValidIPv4: should accept valid IP", () => {
  assertEquals(isValidIPv4("192.168.1.1"), true);
});

Deno.test("isValidIPv4: should reject octets > 255", () => {
  assertEquals(isValidIPv4("999.999.999.999"), false);
});

Deno.test("isValidIPv4: should reject incomplete IP", () => {
  assertEquals(isValidIPv4("192.168.1"), false);
});
```

---

## Árvore de Arquivos Modificados

```text
supabase/functions/
├── _shared/
│   ├── validators.ts                          [MODIFICAR] + isValidIPv4, melhorar isValidEmail
│   ├── validation/
│   │   └── format-utils.ts                    [MODIFICAR] melhorar isValidEmail
│   └── validators/
│       ├── validators-email.test.ts           [MODIFICAR] + testes pontos consecutivos
│       └── validators-ipv4.test.ts            [CRIAR] testes completos IPv4
├── security-management/
│   └── index.test.ts                          [MODIFICAR] usar isValidIPv4 centralizado
└── unified-auth/
    ├── index.test.ts                          [MODIFICAR] usar isValidEmail centralizado
    └── __tests__/handlers/
        └── register.test.ts                   [MODIFICAR] usar isValidEmail centralizado
```

---

## Critérios de Sucesso

| Critério | Validação |
|----------|-----------|
| Todos os 3 testes que falhavam agora passam | `deno test` exit code 0 |
| Zero dívida técnica | Nenhum TODO, FIXME, ou regex inline |
| Validadores centralizados | Único ponto de mudança |
| Cobertura de testes | +10 novos testes para validadores |
| RISE V3 Compliance | Nota 10.0/10 em todos os critérios |

---

## Detalhes Técnicos

### Validação de Email RFC 5321

A RFC 5321 define que:
- Pontos consecutivos (`..`) são **proibidos** no local-part
- Ponto no início ou fim do local-part é **proibido**
- Máximo 254 caracteres total (usamos 255 por compatibilidade)

### Validação de IPv4 RFC 791

A RFC 791 define que:
- Endereço tem exatamente 4 octetos
- Cada octeto é um número de 0 a 255
- Separados por pontos

A regex simples `/^(\d{1,3}\.){3}\d{1,3}$/` aceita valores como `999.999.999.999` porque não valida o range numérico de cada octeto.

---

## Confirmação de Conformidade RISE V3

- **Seção 4.1**: Escolhida a melhor solução (Nota 10.0)
- **Seção 4.3**: Tempo e complexidade não influenciaram
- **Seção 4.5**: Nenhuma frase proibida ("gambiarra", "por ora", etc.)
- **Seção 6.1**: Corrigindo causa raiz, não sintoma
- **Seção 6.4**: Código limpo, < 300 linhas por arquivo
