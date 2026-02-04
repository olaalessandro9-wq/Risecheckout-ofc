-- RISE V3: Resolver duplicatas de phone antes de criar constraint
-- Mantém o telefone no registro mais antigo, limpa nos mais recentes

-- Passo 1: Limpar telefone duplicado do registro mais recente
UPDATE public.users 
SET phone = NULL 
WHERE id = '6732c392-7564-4fd6-ae0e-fcdc6da0744a' 
AND phone = '61992039398';

-- Passo 2: Criar unique index para telefone (apenas valores não-nulos e não-vazios)
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique 
ON public.users (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Passo 3: Criar unique index para CPF/CNPJ (apenas valores não-nulos e não-vazios)
CREATE UNIQUE INDEX IF NOT EXISTS users_cpf_cnpj_unique 
ON public.users (cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';