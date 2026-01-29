
# Refatoração: validation.test.ts → 4 Arquivos Modulares

## Análise RISE V3 (Seção 4.4)

### Solução A: Divisão Simples em 4 Arquivos
- Manutenibilidade: 8/10 (modularização básica)
- Zero DT: 7/10 (pode haver código duplicado entre arquivos)
- Arquitetura: 7/10 (não segue SRP perfeitamente)
- Escalabilidade: 8/10 (permite expansão)
- Segurança: 9/10 (mantém testes de XSS)
- **NOTA FINAL: 7.8/10**
- Tempo estimado: 1 hora

### Solução B: Divisão por Responsabilidade Única com Infraestrutura Compartilhada
- Manutenibilidade: 10/10 (cada arquivo testa exatamente uma responsabilidade)
- Zero DT: 10/10 (imports centralizados, zero duplicação)
- Arquitetura: 10/10 (segue SRP, cada describe em arquivo próprio)
- Escalabilidade: 10/10 (adicionar novos testes é trivial)
- Segurança: 10/10 (testes de XSS em arquivo dedicado)
- **NOTA FINAL: 10.0/10**
- Tempo estimado: 2 horas

### DECISÃO: Solução B (Nota 10.0/10)
A Solução A é inferior porque não separa completamente as responsabilidades (masks vs validations vs helpers vs security) e pode levar a imports duplicados.

---

## Estrutura Atual (600 linhas - VIOLAÇÃO)

```text
src/lib/validation.test.ts (600 linhas)
├── describe("Mask Functions") [Linhas 39-237]
│   ├── maskCPF (~40 linhas)
│   ├── maskCNPJ (~40 linhas)
│   ├── maskPhone (~33 linhas)
│   ├── maskName (~28 linhas)
│   ├── unmask (~20 linhas)
│   └── maskDocument (~18 linhas)
├── describe("Validation Functions") [Linhas 243-493]
│   ├── validateCPF (~39 linhas)
│   ├── validateCNPJ (~37 linhas)
│   ├── validatePhone (~39 linhas)
│   ├── validateEmail (~29 linhas)
│   ├── validateName (~33 linhas)
│   ├── validatePassword (~21 linhas)
│   └── validateDocument (~23 linhas)
├── describe("Helper Functions") [Linhas 499-521]
│   └── detectDocumentType (~21 linhas)
├── describe("ERROR_MESSAGES") [Linhas 527-547]
│   └── (~20 linhas)
└── describe("Edge Cases & Security") [Linhas 553-600]
    ├── XSS Prevention (~14 linhas)
    ├── Unicode handling (~8 linhas)
    ├── Whitespace handling (~8 linhas)
    └── Null-like string handling (~10 linhas)
```

---

## Estrutura Proposta (4 Arquivos)

```text
src/lib/__tests__/
├── validation.masks.test.ts       (~180 linhas) ✅
├── validation.cpf-cnpj.test.ts    (~160 linhas) ✅
├── validation.phone-email.test.ts (~140 linhas) ✅
└── validation.helpers.test.ts     (~120 linhas) ✅

TOTAL: ~600 linhas → 4 arquivos < 200 linhas cada
```

---

## Detalhamento dos Arquivos

### 1. validation.masks.test.ts (~180 linhas)

**Responsabilidade:** Testes de todas as funções de máscara.

```text
DESCRIBE: Mask Functions
├── DESCRIBE: maskCPF
│   ├── IT: empty string → empty
│   ├── IT: 1-3 digits → digits only
│   ├── IT: 4-6 digits → add first dot
│   ├── IT: 7-9 digits → add second dot
│   ├── IT: 10-11 digits → add dash
│   ├── IT: limit to 11 digits
│   ├── IT: strip non-numeric
│   └── IT: handle already formatted
├── DESCRIBE: maskCNPJ
│   ├── IT: empty string → empty
│   ├── IT: 1-2 digits → digits only
│   ├── IT: 3-5 digits → add first dot
│   ├── IT: 6-8 digits → add second dot
│   ├── IT: 9-12 digits → add slash
│   ├── IT: 13-14 digits → add dash
│   ├── IT: limit to 14 digits
│   └── IT: strip non-numeric
├── DESCRIBE: maskPhone
│   ├── IT: empty string → empty
│   ├── IT: 1-2 digits → digits only
│   ├── IT: 3-6 digits → add parentheses
│   ├── IT: 10 digits → landline format
│   ├── IT: 11 digits → mobile format
│   ├── IT: limit to 11 digits
│   └── IT: strip non-numeric
├── DESCRIBE: maskName
│   ├── IT: empty string → empty
│   ├── IT: allow letters and spaces
│   ├── IT: allow accented characters
│   ├── IT: strip numbers
│   ├── IT: strip special characters
│   └── IT: preserve multiple spaces
├── DESCRIBE: unmask
│   ├── IT: empty string → empty
│   ├── IT: remove all non-numeric
│   ├── IT: return only digits
│   └── IT: handle no digits
└── DESCRIBE: maskDocument
    ├── IT: mask as CPF for <= 11 digits
    ├── IT: mask as CNPJ for > 11 digits
    ├── IT: handle partial CPF
    └── IT: handle partial CNPJ
```

**Testes:** ~32 testes

---

### 2. validation.cpf-cnpj.test.ts (~160 linhas)

**Responsabilidade:** Testes de validação de CPF e CNPJ.

```text
DESCRIBE: CPF Validation
├── IT.EACH: valid CPFs (4 casos)
├── IT.EACH: invalid CPFs (7 casos)
├── IT: reject empty string
└── IT: reject all same digits (10 casos)

DESCRIBE: CNPJ Validation
├── IT.EACH: valid CNPJs (4 casos)
├── IT.EACH: invalid CNPJs (5 casos)
├── IT: reject empty string
└── IT: reject all same digits (10 casos)

DESCRIBE: validateDocument (auto-detect)
├── IT: validate CPF when <= 11 digits
├── IT: validate CNPJ when > 11 digits
├── IT: reject invalid CPF
├── IT: reject invalid CNPJ
└── IT: return false for empty
```

**Testes:** ~40 testes (incluindo it.each)

---

### 3. validation.phone-email.test.ts (~140 linhas)

**Responsabilidade:** Testes de validação de phone, email, name e password.

```text
DESCRIBE: Phone Validation
├── IT.EACH: valid phones (5 casos)
├── IT.EACH: invalid phones (5 casos)
├── IT: reject empty string
├── IT: accept landline format
└── IT: accept mobile format

DESCRIBE: Email Validation
├── IT.EACH: valid emails (5 casos)
└── IT.EACH: invalid emails (8 casos)

DESCRIBE: Name Validation
├── IT: accept valid names
├── IT: accept names with accents
├── IT: reject short names (< 3 chars)
├── IT: accept exactly 3 characters
├── IT: reject names with numbers
└── IT: reject names with special chars

DESCRIBE: Password Validation
├── IT: accept 6+ characters
├── IT: reject < 6 characters
├── IT: accept exactly 6 characters
└── IT: accept special characters
```

**Testes:** ~30 testes

---

### 4. validation.helpers.test.ts (~120 linhas)

**Responsabilidade:** Helpers, ERROR_MESSAGES e Edge Cases/Security.

```text
DESCRIBE: Helper Functions
├── DESCRIBE: detectDocumentType
│   ├── IT: detect CPF for <= 11 digits
│   ├── IT: detect CNPJ for 12-14 digits
│   ├── IT: return null for > 14 digits
│   └── IT: handle empty string as CPF

DESCRIBE: ERROR_MESSAGES
├── IT: have all required error messages
└── IT: have meaningful error messages

DESCRIBE: Edge Cases & Security
├── DESCRIBE: XSS Prevention in masks
│   ├── IT: strip script tags from maskName
│   └── IT: strip HTML from maskName
├── DESCRIBE: Unicode handling
│   ├── IT: handle emoji in unmask
│   └── IT: handle emoji in maskName
├── DESCRIBE: Whitespace handling
│   ├── IT: handle leading/trailing spaces in unmask
│   └── IT: preserve spaces in maskName
└── DESCRIBE: Null-like string handling
    ├── IT: handle 'null' string in masks
    └── IT: handle 'undefined' string in masks
```

**Testes:** ~14 testes

---

## Arquivos a Criar

| # | Arquivo | Linhas | Testes | Responsabilidade |
|---|---------|--------|--------|------------------|
| 1 | `src/lib/__tests__/validation.masks.test.ts` | ~180 | 32 | Funções de máscara |
| 2 | `src/lib/__tests__/validation.cpf-cnpj.test.ts` | ~160 | 40 | CPF/CNPJ validation |
| 3 | `src/lib/__tests__/validation.phone-email.test.ts` | ~140 | 30 | Phone/Email/Name/Password |
| 4 | `src/lib/__tests__/validation.helpers.test.ts` | ~120 | 14 | Helpers, constants, security |

**Total:** 4 arquivos, ~600 linhas, ~116 testes

---

## Ações de Implementação

1. **Criar** `src/lib/__tests__/validation.masks.test.ts`
   - Mover describe("Mask Functions") completo
   - Manter imports apenas das funções de máscara

2. **Criar** `src/lib/__tests__/validation.cpf-cnpj.test.ts`
   - Mover validateCPF, validateCNPJ, validateDocument
   - Manter imports das funções de validação de documentos

3. **Criar** `src/lib/__tests__/validation.phone-email.test.ts`
   - Mover validatePhone, validateEmail, validateName, validatePassword
   - Manter imports das funções de validação de contato

4. **Criar** `src/lib/__tests__/validation.helpers.test.ts`
   - Mover detectDocumentType, ERROR_MESSAGES, Edge Cases
   - Manter imports de helpers e constantes

5. **Deletar** `src/lib/validation.test.ts`
   - Remover arquivo original após criação dos 4 novos

---

## Validação RISE V3

| Critério | Status |
|----------|--------|
| LEI SUPREMA (Seção 4) | ✅ Solução B (nota 10.0) |
| Zero Tipos `any` | ✅ Nenhum tipo any |
| Limite 300 Linhas | ✅ Todos < 200 linhas |
| Testing Pyramid | ✅ 100% Unit Tests |
| Documentação JSDoc | ✅ Header em cada arquivo |
| Frases Proibidas | ✅ Nenhuma utilizada |
| Código Morto | ✅ Nenhum após refatoração |

---

## Resultado Esperado

```text
ANTES:
├── src/lib/validation.test.ts (600 linhas) ❌ VIOLAÇÃO

DEPOIS:
├── src/lib/__tests__/validation.masks.test.ts (~180 linhas) ✅
├── src/lib/__tests__/validation.cpf-cnpj.test.ts (~160 linhas) ✅
├── src/lib/__tests__/validation.phone-email.test.ts (~140 linhas) ✅
└── src/lib/__tests__/validation.helpers.test.ts (~120 linhas) ✅

Conformidade: 100% RISE V3 10.0/10
```
