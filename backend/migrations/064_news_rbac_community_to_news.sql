-- Task 05: RBAC Tin tức community.* → news.*
-- Đổi key tại chỗ (cùng permission_id) để role gán sẵn không mất.
-- Seed catalog sau migration upsert news.* — không xóa quyền đã gán.

UPDATE admin_permissions
SET key = replace(key, 'community.', 'news.'),
    module = 'news',
    module_label = CASE WHEN module_label = 'community' THEN 'news' ELSE module_label END
WHERE key LIKE 'community.%' OR module = 'community';
