-- SQL Migration: Add media status fields to community_posts (Task 270731_Automated_Media_Import_Trigger)
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS media_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS media_retry_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_last_error TEXT;

-- Index lọc trạng thái PENDING/FAILED để quét nhanh với chi phí O(1)
CREATE INDEX IF NOT EXISTS idx_posts_media_status 
ON community_posts(media_status) 
WHERE media_status IN ('PENDING', 'FAILED');
