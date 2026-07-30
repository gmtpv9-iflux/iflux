-- Phase D6 — Taxonomy unification: group_label sole SoT · DROP preference_group
-- Replacement refactor — NOT compatibility migration

-- 0. Allow NULL for non-configurable types (B5)
ALTER TABLE notification_types ALTER COLUMN group_label DROP NOT NULL;

-- 1. Normalize group_label → canonical human labels
UPDATE notification_types SET group_label = 'Affiliate'
  WHERE group_label LIKE '%Membership%';

UPDATE notification_types SET group_label = 'Cộng đồng'
  WHERE group_label LIKE '%Cộng đồng%'
     OR group_label LIKE '%Tương tác%';

UPDATE notification_types SET group_label = 'Theo dõi'
  WHERE group_label LIKE '%Theo dõi%';

UPDATE notification_types SET group_label = 'Cảnh báo thông minh'
  WHERE group_label LIKE '%Cảnh báo thông%'
    AND group_label NOT LIKE '%Broadcast%';

UPDATE notification_types SET group_label = 'Hệ thống'
  WHERE group_label LIKE '%Alert Hệ thống%'
     OR group_label LIKE '%Broadcast%';

UPDATE notification_types SET group_label = NULL
  WHERE group_label LIKE '%Gói đăng ký%'
     OR group_label LIKE '%Vận hành%'
     OR group_label LIKE '%Platform%'
     OR group_label LIKE '%Internal%';

-- 2. DROP redundant column (no dual-read)
ALTER TABLE notification_types DROP COLUMN IF EXISTS preference_group;
DROP INDEX IF EXISTS idx_notification_types_preference_group;
DROP INDEX IF EXISTS idx_notification_types_preference_bucket;
