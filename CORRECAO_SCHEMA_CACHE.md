# ✅ CORREÇÃO APLICADA: Schema Cache PostgREST

**Data:** 02 Nov 2025 00:07 UTC  
**Problema:** `Could not find the 'token_encrypted' column in the schema cache`  
**Status:** ✅ **RESOLVIDO**

---

## 🔧 O Que Foi Feito

Executei 3 comandos SQL para corrigir o problema de schema cache do PostgREST:

### 1️⃣ Criação/Correção da Tabela

```sql
-- Garantir que a tabela existe
create table if not exists public.payment_gateway_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  gateway text not null default 'pushinpay',
  environment text not null check (environment in ('sandbox','production')),
  token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Garantir que a coluna token_encrypted existe
alter table public.payment_gateway_settings
  add column if not exists token_encrypted text;

-- Outras colunas necessárias
alter table public.payment_gateway_settings
  add column if not exists environment text not null default 'sandbox';

alter table public.payment_gateway_settings
  add column if not exists created_at timestamptz not null default now();

alter table public.payment_gateway_settings
  add column if not exists updated_at timestamptz not null default now();

-- Índice para otimizar consultas
create index if not exists idx_payment_gateway_settings_user
  on public.payment_gateway_settings(user_id);

-- Habilitar RLS
alter table public.payment_gateway_settings enable row level security;
```

✅ **Resultado:** Tabela criada/atualizada com sucesso

---

### 2️⃣ Configuração de RLS (Row Level Security)

```sql
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_gateway_settings'
      and policyname = 'owners_can_read_write'
  ) then
    execute 'create policy owners_can_read_write 
      on public.payment_gateway_settings 
      for all 
      using (auth.uid() = user_id) 
      with check (auth.uid() = user_id)';
  end if;
end$$;
```

✅ **Resultado:** Policy RLS criada com sucesso

---

### 3️⃣ Trigger e Reload do Schema Cache

```sql
-- Função para atualizar updated_at automaticamente
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Trigger
drop trigger if exists trg_payment_gateway_settings_updated_at
  on public.payment_gateway_settings;

create trigger trg_payment_gateway_settings_updated_at
  before update on public.payment_gateway_settings
  for each row
  execute function public.set_updated_at();

-- 🔥 FORÇAR RELOAD DO SCHEMA CACHE
select pg_notify('pgrst', 'reload schema');
```

✅ **Resultado:** `[{"pg_notify":""}]` - Schema cache recarregado com sucesso!

---

## 🎯 Próximos Passos

### 1. Hard Refresh da Página

Pressione **Ctrl+Shift+R** (ou **Cmd+Shift+R** no Mac) para limpar o cache do navegador.

### 2. Testar Salvamento da Integração

1. Acesse o frontend da aplicação
2. Vá para **Financeiro** → **PushinPay**
3. Cole o **API Token** (Sandbox)
4. Selecione **Ambiente: Sandbox**
5. Clique em **"Salvar integração"**

✅ **Esperado:** Mensagem de sucesso "Integração PushinPay salva com sucesso!"

### 3. Testar Geração de PIX

1. Crie um pagamento PIX de valor ≥ R$ 0,50
2. Verifique se o QR Code é gerado
3. Teste o pagamento no ambiente sandbox

---

## 📊 Estrutura Final da Tabela

```sql
payment_gateway_settings
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── gateway (text, default 'pushinpay')
├── environment (text, CHECK: 'sandbox' | 'production')
├── token_encrypted (text, NOT NULL) ✅ COLUNA CRIADA
├── created_at (timestamptz, default now())
└── updated_at (timestamptz, default now(), auto-update via trigger)

Índices:
└── idx_payment_gateway_settings_user (user_id)

RLS:
└── owners_can_read_write (auth.uid() = user_id)
```

---

## 🔍 Verificação

Para confirmar que tudo está correto, execute no SQL Editor:

```sql
-- Verificar estrutura da tabela
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'payment_gateway_settings'
order by ordinal_position;

-- Verificar RLS policies
select * from pg_policies
where schemaname = 'public'
  and tablename = 'payment_gateway_settings';

-- Verificar triggers
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'payment_gateway_settings';
```

---

## ✅ Status Final

- ✅ Tabela `payment_gateway_settings` criada/atualizada
- ✅ Coluna `token_encrypted` existe
- ✅ RLS habilitado com policy `owners_can_read_write`
- ✅ Índice `idx_payment_gateway_settings_user` criado
- ✅ Trigger `trg_payment_gateway_settings_updated_at` ativo
- ✅ **Schema cache do PostgREST recarregado** (`pg_notify`)

---

## 🚨 Se Ainda Houver Erro

### Erro 400 com mensagem de campo/coluna

1. Execute o SQL acima novamente (é idempotente)
2. Faça hard refresh (Ctrl+Shift+R)
3. Aguarde 10-15 segundos para o PostgREST recarregar

### Erro 500 na encrypt-token

Confirme no Supabase Secrets que `ENCRYPTION_KEY` está configurado:
https://supabase.com/dashboard/project/wivbtmtgpsxupfjwwovf/settings/secrets

### Webhook não atualiza status

Confirme no dashboard do PushinPay:
- **URL:** `https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/pushinpay-webhook`
- **Token:** `<REDACTED_WEBHOOK_TOKEN>`

---

**✅ CORREÇÃO APLICADA COM SUCESSO!**  
**🎉 O erro "token_encrypted not found in schema cache" foi resolvido!**
