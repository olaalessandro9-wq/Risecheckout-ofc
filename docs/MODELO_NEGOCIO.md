# 📊 Modelo de Negócio - RiseCheckout

**Última Atualização:** 16 de Janeiro de 2026  
**Status:** ✅ Produção - 100% Implementado

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Hierarquia de Papéis](#hierarquia-de-papéis)
3. [Regras de Taxa da Plataforma (4%)](#regras-de-taxa-da-plataforma-4)
4. [Programa de Afiliados](#programa-de-afiliados)
5. [Modelo de Split (CAKTO)](#modelo-de-split-cakto)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Implementação Técnica](#implementação-técnica)

---

## Visão Geral

O RiseCheckout opera sob um modelo simplificado onde:

- **Owner = Plataforma = Checkout** - O dono da plataforma é a própria plataforma
- **Taxa padrão: 4%** - Cobrada de vendedores comuns
- **Programa de Afiliados exclusivo** - Apenas o Owner pode TER afiliados

Este modelo foi projetado para máxima simplicidade operacional e clareza financeira.

---

## Hierarquia de Papéis

| Role | Prioridade | Descrição | Paga Taxa | Pode TER Afiliados | Pode SER Afiliado |
|------|------------|-----------|-----------|-------------------|-------------------|
| `owner` | 1 (maior) | Dono da plataforma, é a própria plataforma | ❌ **Isento** | ✅ **SIM (exclusivo)** | ❌ |
| `admin` | 2 | Administrador, suporte operacional | ✅ 4% | ❌ | ✅ |
| `user` | 3 | Usuário padrão do sistema | ✅ 4% | ❌ | ✅ |
| `seller` | 4 (menor) | Vendedor, permissões limitadas | ✅ 4% | ❌ | ✅ |

> **Regra de Herança**: Um role de prioridade maior herda as permissões de roles menores.

---

## Regras de Taxa da Plataforma (4%)

A taxa da plataforma segue regras específicas dependendo de quem vende e como:

### 📌 Cenário 1: Owner Vendendo DIRETO (Sem Afiliado)

```
Taxa: 0%
Motivo: Owner É a plataforma - não faz sentido cobrar de si mesmo
Resultado: Owner recebe 100% (após taxa do gateway)
```

**Lógica de negócio:**
- O Owner é o dono do checkout
- Cobrar taxa de si mesmo não tem sentido
- Todo o valor (após gateway) fica com o Owner

### 📌 Cenário 2: Owner Vendendo COM Afiliado

```
Taxa: 4% (calculada para split)
Destino da Taxa: Retorna ao próprio Owner
Comissão Afiliado: X% do líquido (após 4%)
Resultado: Owner ganha taxa + sua parte do split
```

**Lógica de negócio:**
- A taxa precisa ser calculada para o cálculo correto do split
- A taxa é descontada ANTES de calcular comissão do afiliado
- No final, a taxa "volta" ao Owner como parte de sua receita

### 📌 Cenário 3: Vendedor Comum (Sem Afiliado)

```
Taxa: 4%
Destino: Plataforma (Owner)
Resultado: Vendedor recebe 96% (antes da taxa do gateway)
```

**Lógica de negócio:**
- Vendedor comum sempre paga taxa
- Taxa vai para a conta do Owner (plataforma)

### 📌 Cenário 4: Vendedor COM Afiliado do Owner

```
Taxa: 4% → Vai para Owner
Comissão Afiliado: X% do líquido
Resultado: Vendedor paga 4% + comissão ao afiliado
```

> **Nota**: Afiliados só podem existir em produtos do Owner (Cenário 2), nunca em produtos de vendedores comuns.

---

## Programa de Afiliados

### Regra Principal

> **APENAS o Owner pode TER um programa de afiliados.**

Isso significa:

| Ação | Owner | Admin/User/Seller |
|------|-------|-------------------|
| Criar programa de afiliados | ✅ SIM | ❌ NÃO |
| Ter afiliados em seus produtos | ✅ SIM | ❌ NÃO |
| Se afiliar a produtos (do Owner) | ❌ NÃO | ✅ SIM |
| Acessar marketplace | ✅ SIM | ✅ SIM |

### Por Que Esta Restrição?

1. **Simplicidade**: Evita complexidade de split multi-nível
2. **Controle**: Plataforma (Owner) mantém controle total do programa
3. **Clareza Financeira**: Fluxo de dinheiro sempre claro e previsível

---

## Modelo de Split (CAKTO)

O RiseCheckout usa o **Modelo CAKTO** para cálculo de splits:

### Ordem de Deduções

```
1. Gateway deduz sua taxa (ex: ~4.99% Mercado Pago)
2. Plataforma deduz 4% do valor BRUTO
3. Afiliado recebe X% do valor LÍQUIDO (após 4%)
4. Produtor recebe o restante
```

### Fórmula

```
Taxa Gateway     = Valor Bruto × Taxa Gateway%
Taxa Plataforma  = Valor Bruto × 4%
Valor Líquido    = Valor Bruto - Taxa Plataforma
Comissão Afiliado = Valor Líquido × Comissão%
Valor Produtor   = Valor Líquido - Comissão Afiliado
```

---

## Exemplos Práticos

### Exemplo 1: Owner Vendendo DIRETO (R$ 100,00)

```
┌─────────────────────────────────────────────────────────┐
│ Venda: R$ 100,00 | Vendedor: OWNER | Afiliado: NÃO     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  R$ 100,00 (bruto)                                     │
│    └─ Taxa Plataforma: R$ 0,00 (0% - isento)           │
│    └─ Taxa Gateway (~5%): R$ 5,00                      │
│                                                         │
│  ═══════════════════════════════════════════════════   │
│  RESULTADO:                                             │
│    → Owner recebe: R$ 95,00 (100%)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Exemplo 2: Owner COM Afiliado 50% (R$ 100,00)

```
┌─────────────────────────────────────────────────────────┐
│ Venda: R$ 100,00 | Vendedor: OWNER | Afiliado: 50%     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  R$ 100,00 (bruto)                                     │
│    └─ Taxa Plataforma: R$ 4,00 (4%)                    │
│                                                         │
│  R$ 96,00 (líquido para split)                         │
│    └─ Afiliado 50%: R$ 48,00                           │
│    └─ Produtor 50%: R$ 48,00                           │
│                                                         │
│  ═══════════════════════════════════════════════════   │
│  RESULTADO (antes do gateway):                          │
│    → Taxa Plataforma: R$ 4,00   → Owner                │
│    → Produtor 50%: R$ 48,00     → Owner                │
│    → Afiliado 50%: R$ 48,00     → Afiliado             │
│                                                         │
│  TOTAL OWNER: R$ 52,00 (4 + 48)                        │
│  TOTAL AFILIADO: R$ 48,00                              │
│                                                         │
│  (Taxa do gateway ~5% é descontada pelo MP no final)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Exemplo 3: Vendedor Comum (R$ 100,00)

```
┌─────────────────────────────────────────────────────────┐
│ Venda: R$ 100,00 | Vendedor: USER | Afiliado: NÃO      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  R$ 100,00 (bruto)                                     │
│    └─ Taxa Plataforma: R$ 4,00 (4%) → Owner            │
│                                                         │
│  R$ 96,00 (líquido)                                    │
│    └─ Vendedor recebe: R$ 96,00                        │
│                                                         │
│  ═══════════════════════════════════════════════════   │
│  RESULTADO (antes do gateway):                          │
│    → Plataforma (Owner): R$ 4,00                       │
│    → Vendedor: R$ 96,00                                │
│                                                         │
│  (Taxa do gateway ~5% é descontada do vendedor)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Exemplo 4: Vendedor com Taxa Personalizada (R$ 100,00)

```
┌─────────────────────────────────────────────────────────┐
│ Venda: R$ 100,00 | Vendedor: USER (2% custom)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  R$ 100,00 (bruto)                                     │
│    └─ Taxa Plataforma: R$ 2,00 (2% personalizada)      │
│                                                         │
│  R$ 98,00 (líquido)                                    │
│    └─ Vendedor recebe: R$ 98,00                        │
│                                                         │
│  ═══════════════════════════════════════════════════   │
│  RESULTADO:                                             │
│    → Plataforma (Owner): R$ 2,00                       │
│    → Vendedor: R$ 98,00                                │
│                                                         │
│  NOTA: Taxas personalizadas são configuradas           │
│  via profiles.custom_fee_percent                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### Arquivos Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `supabase/functions/_shared/platform-config.ts` | Constantes e funções de cálculo |
| `supabase/functions/create-order/index.ts` | Lógica de criação de pedido e split |
| `src/hooks/usePermissions.ts` | Verificação de permissões no frontend |
| `src/lib/permissions.ts` | Função `can_have_affiliates()` |

### Constantes Principais

```typescript
// Taxa padrão da plataforma
PLATFORM_FEE_PERCENT = 0.04  // 4%

// ID do Owner da plataforma
PLATFORM_OWNER_USER_ID = "ccff612c-93e6-4acc-85d9-7c9d978a7e4e"

// Collector IDs para split
PLATFORM_MERCADOPAGO_COLLECTOR_ID = "3002802852"
PLATFORM_PUSHINPAY_ACCOUNT_ID = "A0557404-1578-4F50-8AE7-AEF8711F03D1"
```

### Lógica de Taxa (create-order)

```typescript
// Pseudocódigo da lógica
if (isOwner && !hasActiveAffiliate) {
  // Owner vendendo DIRETO: Taxa 0%
  platformFeeCents = 0;
} else if (isOwner && hasActiveAffiliate) {
  // Owner COM afiliado: Taxa calculada (retorna ao Owner)
  platformFeeCents = bruto * 0.04;
} else {
  // Vendedor comum: Taxa normal
  platformFeeCents = bruto * 0.04;
}
```

### Verificação de Permissão (Afiliados)

```sql
-- Função SQL: can_have_affiliates
CREATE FUNCTION can_have_affiliates(p_user_id uuid)
RETURNS boolean
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'owner'
  )
$$;
```

---

## 📞 Referências

- [ADMIN_ROUTES_SECURITY.md](./ADMIN_ROUTES_SECURITY.md) - Segurança de rotas
- [SPLIT_IMPLEMENTATION_COMPLETE.md](../SPLIT_IMPLEMENTATION_COMPLETE.md) - Detalhes do split
- [STATUS_ATUAL.md](./STATUS_ATUAL.md) - Status do sistema
- [EXECUTIVE_REPORT.md](./EXECUTIVE_REPORT.md) - Relatório executivo

---

*Documento mantido pela equipe de desenvolvimento RiseCheckout.*
