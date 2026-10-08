-- Phát sinh khi viết topics.service.js (Phase 2) — cần biết Topic đã ở trạng thái HIỆN TẠI bao
-- lâu để áp đúng ngưỡng "duy trì D ngày" (sustain_days/archive_sustain_days) khi đánh giá lifecycle
-- (V.1-V.2, Topic_Engine V2 hồi sinh). Thiếu sót nhỏ ở migration 076 — bổ sung ngay, không đợi
-- sang migration riêng của Phase khác.
ALTER TABLE topics ADD COLUMN IF NOT EXISTS status_since TIMESTAMPTZ NOT NULL DEFAULT NOW();
