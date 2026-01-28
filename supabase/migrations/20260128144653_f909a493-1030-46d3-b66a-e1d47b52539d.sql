-- Remove duplicate mobile sections (keeps most recent by created_at)
DELETE FROM product_members_sections
WHERE id IN ('1201efaa-1473-43f6-bd01-a6f4f399b042', '3559a747-491f-4f97-b858-c55cbdbfe255');