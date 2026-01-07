-- Remover constraint antiga e adicionar nova com "mixed"
ALTER TABLE product_member_content 
DROP CONSTRAINT IF EXISTS product_member_content_content_type_check;

ALTER TABLE product_member_content 
ADD CONSTRAINT product_member_content_content_type_check 
CHECK (content_type = ANY (ARRAY['video', 'pdf', 'link', 'text', 'download', 'mixed']));