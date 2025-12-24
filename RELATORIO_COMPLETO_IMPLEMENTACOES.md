# Relatório Completo de Implementações - Duplicação de Produtos e Checkouts

**Data:** 30 de Outubro de 2025  
**Projeto:** Lovable Checkout  
**Repositório:** olaalessandro9-wq/lovabloo-checkout-16140-81239-42802  
**Status:** ⚠️ Implementações concluídas, mas problema de layout em branco persiste

---

## 📋 Histórico Completo de Problemas e Soluções

### **Problema 1: Erro 409 (Conflict) na Duplicação de Produto**

**Sintoma:**
- Ao duplicar produto, recebia erro 409 no POST `/rest/v1/products`

**Causa Raiz:**
- Múltiplos triggers no Supabase tentavam criar checkout/offer default simultaneamente
- Violação do índice único `unique_default_checkout_per_product`

**Solução Aplicada (PR #27):**

**Backend (SQL no Supabase):**
```sql
-- Remover triggers duplicados
drop trigger if exists ensure_default_checkout on public.products;
drop trigger if exists create_default_checkout on public.products;
drop trigger if exists trigger_create_default_checkout on public.products;
drop trigger if exists trg_products_default_checkout on public.products;

-- Criar função idempotente
create or replace function public.ensure_default_checkout()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.checkouts
    where product_id = NEW.id and is_default is true
  ) then
    insert into public.checkouts (product_id, name, is_default)
    values (NEW.id, coalesce(NEW.name, 'Checkout padrão'), true);
  end if;
  return NEW;
end;
$$;

-- Criar trigger único
create trigger trg_products_default_checkout
after insert on public.products
for each row execute function public.ensure_default_checkout();

-- Garantir índice único
create unique index if not exists unique_default_checkout_per_product
  on public.checkouts (product_id)
  where is_default is true;
```

**Frontend (TypeScript):**
- Estratégia de **reaproveitar** checkout/offer criados pelo trigger
- Lógica de retry para aguardar criação pelo trigger
- UPDATE no checkout/offer auto-criado com dados do produto origem
- INSERT apenas dos checkouts/offers não-default

**Resultado:** ✅ Erro 409 resolvido

---

### **Problema 2: Erro 400 (Bad Request) - Campo 'cores' Inexistente**

**Sintoma:**
- Erro PGSTR224: "Could not find the 'cores' column of checkouts in the schema cache"
- Erro 400 em PATCH/POST `/rest/v1/checkouts`

**Causa Raiz:**
- Código enviava campo `cores` nos payloads de checkouts
- Campo `cores` não existe no schema da tabela `checkouts`

**Solução Aplicada (PR #28):**

Removido campo `cores` de todos os payloads:

```typescript
// ANTES (ERRADO)
const ckPatch: any = { 
  name: srcDefaultCk.name, 
  cores: srcDefaultCk.cores ?? null,  // ❌
  slug: newSlug,
  design: clonedDesign,
  is_default: true 
};

// DEPOIS (CORRETO)
const ckPatch: any = { 
  name: srcDefaultCk.name, 
  slug: newSlug,
  design: clonedDesign,
  is_default: true 
};
```

**Resultado:** ✅ Erro 400 resolvido

---

### **Problema 3: Checkout Não Clonava na Aba de Checkouts**

**Sintoma:**
- Ao clicar em "Duplicar" na aba de Checkouts, nada acontecia
- Checkout "duplicado" desaparecia ao recarregar página

**Causa Raiz:**
- Função `handleDuplicateCheckout` apenas criava objeto fake no estado local
- Não salvava no Supabase

**Solução Aplicada (PR #29):**

**1. Helper para nome único:**
```typescript
// src/lib/utils/uniqueCheckoutName.ts
export async function ensureUniqueCheckoutName(
  supabase: any,
  productId: string,
  base: string
): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data, error } = await supabase
      .from("checkouts")
      .select("id")
      .eq("product_id", productId)
      .eq("name", candidate)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return candidate;
    candidate = base.includes("(Cópia)")
      ? `${base.replace(/\s*\(Cópia.*?\)/, "")} (Cópia ${suffix})`
      : `${base} (${suffix})`;
    suffix++;
  }
}
```

**2. Função de duplicação:**
```typescript
// src/lib/checkouts/duplicateCheckout.ts
export async function duplicateCheckout(checkoutId: string) {
  const srcId = checkoutId.replace(/^checkout-/, "");

  const { data: src, error: eSrc } = await supabase
    .from("checkouts")
    .select("id, product_id, name, is_default, components, design")
    .eq("id", srcId)
    .single();
  if (eSrc || !src) throw eSrc ?? new Error("Checkout origem não encontrado");

  const baseName = `${src.name} (Cópia)`;
  const newName = await ensureUniqueCheckoutName(supabase, src.product_id, baseName);

  const insertCk = {
    product_id: src.product_id,
    name: newName,
    is_default: false,
    components: src.components ?? null,
    design: src.design ?? null,
  };

  const { data: created, error: eIns } = await supabase
    .from("checkouts")
    .insert(insertCk)
    .select("id")
    .single();
  if (eIns || !created) throw eIns ?? new Error("Falha ao duplicar checkout");

  const newId = created.id as string;
  const editUrl = `/produtos/checkout/personalizar?id=${newId}`;
  return { id: newId, editUrl };
}
```

**3. Atualização do handler:**
```typescript
// src/pages/ProductEdit.tsx
const handleDuplicateCheckout = async (checkout: Checkout) => {
  try {
    const { duplicateCheckout } = await import("@/lib/checkouts/duplicateCheckout");
    const { id, editUrl } = await duplicateCheckout(checkout.id);
    
    await loadCheckouts();
    toast.success("Checkout duplicado com sucesso!");
    navigate(editUrl);
  } catch (error) {
    console.error("Error duplicating checkout:", error);
    toast.error("Não foi possível duplicar o checkout");
  }
};
```

**Resultado:** ✅ Clonagem de checkout funciona e persiste

---

### **Problema 4: Checkout Fica "Em Branco" Após Duplicação**

**Sintoma:**
- Checkout duplicado não tem layout/tema
- Aparece "em branco" na tela de personalização

**Causa Raiz (Hipótese):**
- Campos de layout não estavam sendo copiados completamente
- Apenas `components` e `design` eram copiados explicitamente

**Solução Aplicada (PR #30):**

**Cópia defensiva de TODOS os campos de layout possíveis:**

```typescript
// Lista de campos de layout
const LAYOUT_KEYS = [
  "components",
  "design",
  "layout",
  "lines",
  "settings",
  "theme",
  "sections",
  "schema",
  "blocks"
];

// Em duplicateProduct.ts - UPDATE do checkout default
const ckPatch: any = { 
  name: srcDefaultCk.name, 
  slug: newSlug,
  design: clonedDesign,
  seller_name: srcDefaultCk.seller_name ?? null,
  is_default: true 
};
// Copiar todos os campos de layout que existirem
for (const k of LAYOUT_KEYS) {
  if (k in srcDefaultCk && k !== "design") {
    ckPatch[k] = (srcDefaultCk as any)[k] ?? null;
  }
}

// Em duplicateProduct.ts - INSERT de checkouts não-default
const insertCk: any = {
  product_id: newProductId,
  name: ck.name,
  slug: newSlug,
  design: clonedDesign,
  seller_name: ck.seller_name ?? null,
  is_default: false,
  visits_count: 0,
};
const LAYOUT_KEYS = ["components","design","layout","lines","settings","theme","sections","schema","blocks"];
for (const k of LAYOUT_KEYS) {
  if (k in ck && k !== "design") {
    insertCk[k] = (ck as any)[k] ?? null;
  }
}

// Em duplicateCheckout.ts - SELECT * e cópia defensiva
const { data: src, error: eSrc } = await supabase
  .from("checkouts")
  .select("*")  // ✅ Pega TODOS os campos
  .eq("id", srcId)
  .single();

const insertCk: any = {
  product_id: src.product_id,
  name: newName,
  is_default: false,
};
const LAYOUT_KEYS = ["components","design","layout","lines","settings","theme","sections","schema","blocks"];
for (const k of LAYOUT_KEYS) {
  if (k in src) insertCk[k] = (src as any)[k] ?? null;
}
```

**Resultado:** ⚠️ **AINDA NÃO FUNCIONOU** - Checkout continua em branco

---

## 📊 Resumo dos Pull Requests

| PR | Commit | Descrição | Status |
|----|--------|-----------|--------|
| #26 | `6c3c9c4` | Tentativa inicial (deletar trigger effects) | ❌ Abordagem incorreta |
| #27 | `c309e9d` | Solução definitiva (reaproveitar trigger effects) | ✅ Erro 409 resolvido |
| #28 | `9801793` | Remover campo 'cores' inexistente | ✅ Erro 400 resolvido |
| #29 | `3a419d1` | Implementar clonagem real de checkout | ✅ Clonagem funciona |
| #30 | `4e0f064` | Cópia defensiva de todos campos de layout | ⚠️ Checkout ainda em branco |

---

## 🔍 Estado Atual do Código

### **duplicateProduct.ts (Duplicação de Produto)**

**Localização:** `src/lib/products/duplicateProduct.ts`

**Fluxo atual:**

1. **Carrega produto origem** (SELECT com colunas específicas)
2. **Gera nome único** usando `ensureUniqueName`
3. **Insere produto clone** (apenas colunas reais)
4. **Aguarda checkout/offer do trigger** (retry com timeout)
5. **Carrega offers do produto origem**
6. **Atualiza offer default** criada pelo trigger
7. **Insere offers não-default**
8. **Carrega checkouts do produto origem** (SELECT *)
9. **Atualiza checkout default** criado pelo trigger:
   - Clona design com `cloneCustomizationWithImages`
   - Gera slug único
   - Copia `name`, `slug`, `design`, `seller_name`, `is_default`
   - **Loop pelos LAYOUT_KEYS** para copiar campos de layout
10. **Insere checkouts não-default**:
    - Clona design com `cloneCustomizationWithImages`
    - Gera slug único
    - Copia `name`, `slug`, `design`, `seller_name`, `is_default`, `visits_count`
    - **Loop pelos LAYOUT_KEYS** para copiar campos de layout
11. **Clona links dos checkouts**

### **duplicateCheckout.ts (Duplicação de Checkout)**

**Localização:** `src/lib/checkouts/duplicateCheckout.ts`

**Fluxo atual:**

1. **Sanitiza ID** (remove prefixo "checkout-" se existir)
2. **Carrega checkout origem** (SELECT *)
3. **Gera nome único** usando `ensureUniqueCheckoutName`
4. **Monta insert**:
   - Copia `product_id`, `name`, `is_default: false`
   - **Loop pelos LAYOUT_KEYS** para copiar campos de layout
5. **Insere novo checkout**
6. **Retorna ID e URL de edição**

---

## ⚠️ Problema Persistente

**Sintoma:** Checkout duplicado continua "em branco" (sem layout/tema)

**Possíveis Causas:**

1. **Campos de layout têm nomes diferentes no schema real:**
   - Talvez não sejam `components`, `design`, `layout`, etc.
   - Podem ser `customization`, `config`, `styles`, etc.

2. **Layout está em tabelas filhas:**
   - Componentes podem estar em `checkout_components`
   - Seções podem estar em `checkout_sections`
   - Blocos podem estar em `checkout_blocks`

3. **Campo `design` precisa de tratamento especial:**
   - Função `cloneCustomizationWithImages` pode não estar funcionando
   - Imagens podem não estar sendo copiadas corretamente

4. **Campos de layout são JSON e precisam de deep copy:**
   - Pode haver referências a IDs de outros registros
   - Pode haver referências a imagens que precisam ser clonadas

---

## 🔍 Informações Necessárias para Diagnóstico

Para o GPT diagnosticar corretamente, precisamos:

### **1. Schema real da tabela `checkouts`:**

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='checkouts'
order by ordinal_position;
```

### **2. Dados de um checkout que TEM layout:**

```sql
select *
from checkouts
where id = '<id_de_um_checkout_com_layout>'
limit 1;
```

### **3. Verificar se há tabelas filhas:**

```sql
select table_name
from information_schema.tables
where table_schema='public' 
  and table_name like 'checkout_%'
order by table_name;
```

### **4. Payload do SELECT no checkout de origem:**

Abrir DevTools → Network → ao duplicar checkout, verificar:
- Request para `GET /rest/v1/checkouts?id=eq.<uuid>`
- Response body completo

### **5. Payload do INSERT do checkout clone:**

Abrir DevTools → Network → ao duplicar checkout, verificar:
- Request para `POST /rest/v1/checkouts`
- Request Payload completo

---

## 📝 Código Atual Completo

### **duplicateProduct.ts (linhas relevantes)**

```typescript
// 6.1 Atualiza o checkout default criado por trigger
const srcDefaultCk = (srcCheckouts ?? []).find((c: any) => c.is_default);
if (srcDefaultCk && autoCheckout) {
  // Clona customização (design contém as imagens)
  const clonedDesign = await cloneCustomizationWithImages(supabase, srcDefaultCk.design, newProductId);
  
  // Slug único
  const baseSlug = srcDefaultCk.slug || toSlug(srcProduct.name);
  const newSlug = await ensureUniqueSlug(supabase, "checkouts", "slug", baseSlug);
  
  // Copiar layout/tema de forma defensiva
  const LAYOUT_KEYS = [
    "components",
    "design",
    "layout",
    "lines",
    "settings",
    "theme",
    "sections",
    "schema",
    "blocks"
  ];
  const ckPatch: any = { 
    name: srcDefaultCk.name, 
    slug: newSlug,
    design: clonedDesign,
    seller_name: srcDefaultCk.seller_name ?? null,
    is_default: true 
  };
  // Copiar todos os campos de layout que existirem no checkout de origem
  for (const k of LAYOUT_KEYS) {
    if (k in srcDefaultCk && k !== "design") { // design já foi clonado acima
      ckPatch[k] = (srcDefaultCk as any)[k] ?? null;
    }
  }
  const { error: eUpdCk } = await supabase
    .from("checkouts")
    .update(ckPatch)
    .eq("id", autoCheckout.id);
  if (eUpdCk) {
    console.error('[duplicateProductDeep] update auto checkout failed:', eUpdCk);
    throw eUpdCk;
  }
}
```

### **duplicateCheckout.ts (completo)**

```typescript
import { supabase } from "@/integrations/supabase/client";
import { ensureUniqueCheckoutName } from "@/lib/utils/uniqueCheckoutName";

export async function duplicateCheckout(checkoutId: string) {
  const srcId = checkoutId.replace(/^checkout-/, "");

  // 1) Ler checkout de origem (SELECT * para pegar todos os campos)
  const { data: src, error: eSrc } = await supabase
    .from("checkouts")
    .select("*")
    .eq("id", srcId)
    .single();
  if (eSrc || !src) throw eSrc ?? new Error("Checkout origem não encontrado");

  // 2) Gerar nome único no MESMO produto
  const baseName = `${src.name} (Cópia)`;
  const newName = await ensureUniqueCheckoutName(supabase, src.product_id, baseName);

  // 3) Montar insert do ZERO (sem cores/slug/id/etc.) + layout defensivo
  const insertCk: any = {
    product_id: src.product_id,
    name: newName,
    is_default: false,
  };
  const LAYOUT_KEYS = ["components","design","layout","lines","settings","theme","sections","schema","blocks"];
  for (const k of LAYOUT_KEYS) {
    if (k in src) insertCk[k] = (src as any)[k] ?? null;
  }

  const { data: created, error: eIns } = await supabase
    .from("checkouts")
    .insert(insertCk)
    .select("id")
    .single();
  if (eIns || !created) throw eIns ?? new Error("Falha ao duplicar checkout");

  const newId = created.id as string;
  const editUrl = `/produtos/checkout/personalizar?id=${newId}`;
  return { id: newId, editUrl };
}
```

---

## 🎯 Próximos Passos Sugeridos

1. **Executar queries SQL** para obter schema real e dados de exemplo
2. **Capturar payloads** no DevTools durante duplicação
3. **Enviar informações** ao GPT para diagnóstico preciso
4. **Implementar correção** baseada no diagnóstico do GPT

---

## 📌 Observações Importantes

- ✅ Erro 409 foi resolvido definitivamente
- ✅ Erro 400 foi resolvido definitivamente
- ✅ Clonagem de checkout funciona e persiste
- ⚠️ **Layout/tema não está sendo copiado corretamente**
- 🔍 Precisamos de mais informações do schema real para diagnosticar

---

**Último commit:** `4e0f064`  
**Último PR:** #30  
**Status:** Aguardando diagnóstico do GPT com informações adicionais
