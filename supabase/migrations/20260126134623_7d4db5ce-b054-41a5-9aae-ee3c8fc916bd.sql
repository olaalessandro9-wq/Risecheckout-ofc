-- RISE V3 Final Cleanup: Nullify all legacy color columns
UPDATE checkouts
SET 
  background_color = NULL,
  button_color = NULL,
  button_text_color = NULL
WHERE 
  background_color IS NOT NULL 
  OR button_color IS NOT NULL 
  OR button_text_color IS NOT NULL;