-- ============================================================================
-- SCRIPT: Migração Direta de Tokens para o Vault
-- Data: 2024-12-29
-- Descrição: Migra tokens expostos da tabela vendor_integrations para o Vault
-- ============================================================================

DO $$
DECLARE
    integration_record RECORD;
    secret_name TEXT;
    secret_value TEXT;
    secrets_migrated INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando migração de tokens...';
    
    -- Iterar sobre todas as integrações com tokens expostos
    FOR integration_record IN 
        SELECT id, vendor_id, integration_type, config, active
        FROM vendor_integrations
        WHERE config->>'access_token' IS NOT NULL 
           OR config->>'refresh_token' IS NOT NULL 
           OR config->>'api_key' IS NOT NULL 
           OR config->>'api_token' IS NOT NULL 
           OR config->>'pushinpay_token' IS NOT NULL
    LOOP
        RAISE NOTICE 'Processando % (vendor: %, active: %)', 
            integration_record.integration_type, 
            integration_record.vendor_id, 
            integration_record.active;
        
        -- MERCADOPAGO: access_token
        IF integration_record.config->>'access_token' IS NOT NULL 
           AND integration_record.integration_type = 'MERCADOPAGO' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_mercadopago_access_token';
            secret_value := integration_record.config->>'access_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: mercadopago access_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- MERCADOPAGO: refresh_token
        IF integration_record.config->>'refresh_token' IS NOT NULL 
           AND integration_record.integration_type = 'MERCADOPAGO' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_mercadopago_refresh_token';
            secret_value := integration_record.config->>'refresh_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: mercadopago refresh_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- STRIPE: access_token
        IF integration_record.config->>'access_token' IS NOT NULL 
           AND integration_record.integration_type = 'STRIPE' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_stripe_access_token';
            secret_value := integration_record.config->>'access_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: stripe access_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- STRIPE: refresh_token
        IF integration_record.config->>'refresh_token' IS NOT NULL 
           AND integration_record.integration_type = 'STRIPE' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_stripe_refresh_token';
            secret_value := integration_record.config->>'refresh_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: stripe refresh_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- ASAAS: api_key
        IF integration_record.config->>'api_key' IS NOT NULL 
           AND integration_record.integration_type = 'ASAAS' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_asaas_api_key';
            secret_value := integration_record.config->>'api_key';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: asaas api_key';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- UTMIFY: api_token
        IF integration_record.config->>'api_token' IS NOT NULL 
           AND integration_record.integration_type = 'UTMIFY' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_utmify_api_token';
            secret_value := integration_record.config->>'api_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: utmify api_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- PUSHINPAY: pushinpay_token ou api_token
        IF (integration_record.config->>'pushinpay_token' IS NOT NULL 
            OR integration_record.config->>'api_token' IS NOT NULL)
           AND integration_record.integration_type = 'PUSHINPAY' THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_pushinpay_api_token';
            secret_value := COALESCE(
                integration_record.config->>'pushinpay_token',
                integration_record.config->>'api_token'
            );
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: pushinpay api_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- FACEBOOK_PIXEL: access_token
        IF integration_record.config->>'access_token' IS NOT NULL 
           AND (integration_record.integration_type = 'FACEBOOK_PIXEL' 
                OR integration_record.integration_type = 'FACEBOOK') THEN
            secret_name := 'vendor_' || integration_record.vendor_id || '_facebook_access_token';
            secret_value := integration_record.config->>'access_token';
            
            PERFORM vault.create_secret(secret_value, secret_name);
            RAISE NOTICE '  ✓ Migrado: facebook access_token';
            secrets_migrated := secrets_migrated + 1;
        END IF;
        
        -- Remover tokens do config e atualizar registro
        UPDATE vendor_integrations
        SET config = config 
            - 'access_token' 
            - 'refresh_token' 
            - 'api_key' 
            - 'api_token' 
            - 'pushinpay_token',
            updated_at = NOW()
        WHERE id = integration_record.id;
        
        RAISE NOTICE '  ✓ Config atualizado (tokens removidos)';
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migração concluída!';
    RAISE NOTICE 'Total de secrets migrados: %', secrets_migrated;
    RAISE NOTICE '========================================';
END $$;
