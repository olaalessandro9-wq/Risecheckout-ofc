-- MIGRAÇÃO V7: Adicionar search_path às funções trigger restantes

CREATE OR REPLACE FUNCTION public.auto_fill_stripe_public_key()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.credit_card_gateway::text = 'stripe' AND (NEW.stripe_public_key IS NULL OR NEW.stripe_public_key = '') THEN
    NEW.stripe_public_key := 'pk_test_51SfMd9PUjGQrVYqGeXSGdTzPk4tchR8o6tFNoRgvl3FfFiVbpRZWSuVSwQmobg16oKfqPkIkVtW3HCbzEFDdwwvw00KgqBkhWC';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_default_checkout()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.checkouts where product_id = NEW.id and is_default is true) then
    insert into public.checkouts (product_id, name, is_default) values (NEW.id, coalesce(NEW.name, 'Checkout padrão'), true);
  end if;
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ begin new.updated_at = now(); return new; end $function$;

CREATE OR REPLACE FUNCTION public.sync_marketplace_with_affiliates()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.affiliate_settings->>'enabled')::boolean = false THEN NEW.show_in_marketplace := false; END IF;
  IF NEW.show_in_marketplace = true AND (OLD.show_in_marketplace IS NULL OR OLD.show_in_marketplace = false) THEN NEW.marketplace_enabled_at := now(); END IF;
  IF NEW.show_in_marketplace = false AND OLD.show_in_marketplace = true THEN NEW.marketplace_enabled_at := NULL; END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_offer_to_product()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN IF NEW.is_default = true THEN UPDATE products SET price = NEW.price WHERE id = NEW.product_id; END IF; RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.update_marketplace_categories_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.update_mercadopago_split_config_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ begin new.updated_at = now(); return new; end; $function$;

CREATE OR REPLACE FUNCTION public.update_vendor_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$;