-- Função para salvar/atualizar secrets no Vault
CREATE OR REPLACE FUNCTION vault_upsert_secret(p_name TEXT, p_secret TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta deletar secret existente com o mesmo nome
  DELETE FROM vault.secrets WHERE name = p_name;
  
  -- Insere novo secret
  INSERT INTO vault.secrets (name, secret)
  VALUES (p_name, p_secret);
END;
$$;

-- Função para buscar secrets do Vault
CREATE OR REPLACE FUNCTION vault_get_secret(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = p_name;
  
  RETURN v_secret;
END;
$$;

-- Revogar acesso público às funções (apenas service role pode usar)
REVOKE ALL ON FUNCTION vault_upsert_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION vault_get_secret(TEXT) FROM PUBLIC;

-- Conceder acesso apenas ao service_role
GRANT EXECUTE ON FUNCTION vault_upsert_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION vault_get_secret(TEXT) TO service_role;