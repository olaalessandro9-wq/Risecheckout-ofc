-- ============================================
-- RISE V3: Limpar buyer_profiles de teste
-- PRESERVA orders do owner (apenas limpa FK)
-- ============================================

-- 1. Primeiro, desvincular orders dos buyer_profiles de teste
-- (mantém customer_email intacto para exibição no painel)
UPDATE orders 
SET buyer_id = NULL 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 2. Deletar sessões dos buyers de teste
DELETE FROM buyer_sessions 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 3. Deletar product access dos buyers de teste
DELETE FROM buyer_product_access 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 4. Deletar content access dos buyers de teste
DELETE FROM buyer_content_access 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 5. Deletar content progress dos buyers de teste
DELETE FROM buyer_content_progress 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 6. Deletar groups dos buyers de teste
DELETE FROM buyer_groups 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 7. Deletar saved cards dos buyers de teste
DELETE FROM buyer_saved_cards 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 8. Deletar quiz attempts dos buyers de teste
DELETE FROM buyer_quiz_attempts 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 9. Deletar audit log dos buyers de teste
DELETE FROM buyer_audit_log 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 10. Deletar invite tokens relacionados
DELETE FROM student_invite_tokens 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 11. Deletar certificates dos buyers de teste
DELETE FROM certificates 
WHERE buyer_id IN (
  SELECT id FROM buyer_profiles WHERE password_hash_version = 1
);

-- 12. FINALMENTE: Deletar os buyer_profiles de teste
DELETE FROM buyer_profiles 
WHERE password_hash_version = 1;