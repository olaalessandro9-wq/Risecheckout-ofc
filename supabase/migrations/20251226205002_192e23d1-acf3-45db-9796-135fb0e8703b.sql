-- ========================================================================
-- ADMIN ZERO FEE: Admins não pagam taxa de plataforma
-- ========================================================================
-- Motivo: Admins são parte da equipe da plataforma, não devem pagar taxa.
-- Isso também resolve o conflito sandbox/produção, pois sem taxa = sem split.
-- ========================================================================

-- 1. Definir custom_fee_percent = 0 para todos os admins existentes
UPDATE profiles 
SET custom_fee_percent = 0,
    updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
);

-- 2. Criar função para automaticamente definir taxa 0% quando alguém vira admin
CREATE OR REPLACE FUNCTION public.set_admin_zero_fee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando um usuário recebe role 'admin', define taxa 0%
  IF NEW.role = 'admin' THEN
    UPDATE profiles 
    SET custom_fee_percent = 0,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RAISE NOTICE '[set_admin_zero_fee] Admin % definido com taxa 0%%', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Criar trigger para executar automaticamente
DROP TRIGGER IF EXISTS on_admin_role_assigned ON user_roles;

CREATE TRIGGER on_admin_role_assigned
AFTER INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_zero_fee();