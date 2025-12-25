-- Adicionar 'stripe' ao enum credit_card_gateway_type
ALTER TYPE credit_card_gateway_type ADD VALUE IF NOT EXISTS 'stripe';

-- Criar função para auto-preencher stripe_public_key quando gateway for selecionado
CREATE OR REPLACE FUNCTION auto_fill_stripe_public_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.credit_card_gateway::text = 'stripe' AND (NEW.stripe_public_key IS NULL OR NEW.stripe_public_key = '') THEN
    NEW.stripe_public_key := 'pk_test_51SfMd9PUjGQrVYqGeXSGdTzPk4tchR8o6tFNoRgvl3FfFiVbpRZWSuVSwQmobg16oKfqPkIkVtW3HCbzEFDdwwvw00KgqBkhWC';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_auto_fill_stripe_public_key ON checkouts;

-- Criar trigger para novos checkouts ou atualizações
CREATE TRIGGER trg_auto_fill_stripe_public_key
  BEFORE INSERT OR UPDATE ON checkouts
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_stripe_public_key();