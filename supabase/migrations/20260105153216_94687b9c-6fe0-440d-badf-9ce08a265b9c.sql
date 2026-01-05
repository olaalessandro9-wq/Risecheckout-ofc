-- Remove auto-afiliações do owner (prática agora proibida)
DELETE FROM affiliates 
WHERE id IN (
  '849fd068-dee7-401f-b184-1b80d42bafbc',
  '43914378-ca58-4f76-8bb3-d30f65a57b7b'
);