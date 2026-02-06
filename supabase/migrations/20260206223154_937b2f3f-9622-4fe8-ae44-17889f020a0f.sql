
ALTER TABLE products DROP CONSTRAINT products_description_length;
ALTER TABLE products ADD CONSTRAINT products_description_length 
  CHECK (description IS NULL OR char_length(description) <= 2000);
