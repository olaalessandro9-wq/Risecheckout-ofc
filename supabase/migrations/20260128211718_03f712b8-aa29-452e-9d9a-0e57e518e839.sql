-- Atualizar constraint para incluir fixed_header
ALTER TABLE product_members_sections 
DROP CONSTRAINT IF EXISTS product_members_sections_type_check;

ALTER TABLE product_members_sections 
ADD CONSTRAINT product_members_sections_type_check 
CHECK (type = ANY (ARRAY[
  'banner'::text, 
  'modules'::text, 
  'courses'::text, 
  'continue_watching'::text, 
  'text'::text, 
  'spacer'::text,
  'fixed_header'::text
]));