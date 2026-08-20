-- Task 05: entitlement persist communityRead/Write/Comment → newsRead/Write/Comment.
-- Gỡ leftover pages.community (page identity Tin tức) khi pages.news đã có.

UPDATE sub_admin_entitlements
SET payload = replace(
      replace(
        replace(payload::text, '"communityRead"', '"newsRead"'),
        '"communityWrite"', '"newsWrite"'),
      '"communityComment"', '"newsComment"')::jsonb
WHERE payload::text LIKE '%communityRead%'
   OR payload::text LIKE '%communityWrite%'
   OR payload::text LIKE '%communityComment%';

UPDATE sub_admin_entitlements
SET payload = regexp_replace(
      regexp_replace(payload::text, ',\s*"community"\s*:\s*true', '', 'g'),
      '"community"\s*:\s*true\s*,', '', 'g')::jsonb
WHERE payload::text ~ '"community"\s*:\s*true';
