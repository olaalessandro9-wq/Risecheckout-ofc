-- ============================================================================
-- FIX: PostgREST Schema Cache - payment_gateway_settings
-- ============================================================================
-- Problema: "Could not find the 'token_encrypted' column in the schema cache"
-- Solução: Garantir que a coluna existe e forçar reload do cache
-- ============================================================================

-- 1) Garantir que a tabela exista (sem sobrescrever, só cria se não existir)
create table if not exists public.payment_gateway_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  gateway text not null default 'pushinpay',
  environment text not null check (environment in ('sandbox','production')),
  token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Garantir que a coluna token_encrypted exista
alter table public.payment_gateway_settings
  add column if not exists token_encrypted text;

-- 3) Outras colunas usadas pela UI/funções (idempotente: só cria se faltar)
alter table public.payment_gateway_settings
  add column if not exists environment text not null default 'sandbox';

alter table public.payment_gateway_settings
  add column if not exists created_at timestamptz not null default now();

alter table public.payment_gateway_settings
  add column if not exists updated_at timestamptz not null default now();

-- 4) Índice por usuário (otimiza selects)
create index if not exists idx_payment_gateway_settings_user
  on public.payment_gateway_settings(user_id);

-- 5) RLS (donos podem ler/escrever apenas seus próprios registros)
alter table public.payment_gateway_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_gateway_settings'
      and policyname = 'owners_can_read_write'
  ) then
    create policy "owners_can_read_write"
      on public.payment_gateway_settings
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end$$;

-- 6) Trigger para atualizar updated_at
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_payment_gateway_settings_updated_at
  on public.payment_gateway_settings;

create trigger trg_payment_gateway_settings_updated_at
  before update on public.payment_gateway_settings
  for each row
  execute function public.set_updated_at();

-- 7) 🔥 FORÇAR O POSTGREST A RECARREGAR O SCHEMA (resolve o "schema cache")
select pg_notify('pgrst', 'reload schema');

-- ============================================================================
-- ✅ SCRIPT EXECUTADO COM SUCESSO!
-- ============================================================================
-- Próximos passos:
-- 1. Hard refresh da página (Ctrl+Shift+R)
-- 2. Vá em Financeiro → PushinPay
-- 3. Cole o API Token (Sandbox)
-- 4. Clique em "Salvar integração"
-- 5. Teste gerando um PIX ≥ R$ 0,50
-- ============================================================================
