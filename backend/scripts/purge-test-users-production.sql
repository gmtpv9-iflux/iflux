-- Purge ALL rows in public.users + related User Web data.
-- KHÔNG đụng admin_accounts · admin_roles · admin_permissions · admin_audit_log.
-- Run as postgres superuser on Production before G1 Path C clean-slate test.

BEGIN;

-- Break self-referential FK before bulk delete
UPDATE users SET referred_by = NULL;

-- Orphan / manual user_id tables (no CASCADE or VARCHAR user_id)
DELETE FROM interaction_comment_likes
WHERE user_id IN (SELECT id FROM users);

DELETE FROM interaction_comments
WHERE user_id IN (SELECT id FROM users);

DELETE FROM community_comments
WHERE user_id IN (SELECT id FROM users);

DELETE FROM content_interest_events
WHERE user_id IN (SELECT id::text FROM users);

DELETE FROM content_relevance_events
WHERE user_id IN (SELECT id::text FROM users);

-- Pending email registrations
DELETE FROM email_verification_otps;

-- Core: cascades subscription_orders, user_inbox_notifications, affiliate_*, watchlist, alerts, user_data, preferences, user_follows
DELETE FROM users;

COMMIT;
