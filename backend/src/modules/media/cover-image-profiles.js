'use strict';

/**
 * Danh sách các "trường hợp hiển thị" cần regenerate cho ảnh bài viết.
 * Nguồn dữ liệu duy nhất (single source of truth) — dùng bởi:
 *  - media-process.js (sinh file khi ingest RSS / import ảnh cover)
 *  - media.routes.js GET /cover-profiles (Admin > Quản lý Tin tức > Regenerate đọc từ đây)
 *
 * Mở rộng: thêm 1 trường hợp mới = thêm 1 object vào mảng bên dưới.
 * Không cần sửa DB (media_variants.role là cột TEXT tự do, không có CHECK enum)
 * và không cần sửa trang Admin (trang đọc thẳng mảng này qua API).
 *
 * Kích thước lớn hơn khung hiển thị thực tế (đo từ CSS đang chạy) để không bị mờ
 * trên màn hình mật độ điểm ảnh cao (Retina/2x).
 */
const COVER_IMAGE_PROFILES = [
  {
    key: 'cover_thumb',
    label: 'Card nhỏ',
    description: 'Card nhỏ trong danh sách tin tức (sidebar hero, danh sách compact)',
    width: 240,
    height: 184,
    format: 'webp',
    quality: 82,
    fit: 'cover'
  },
  {
    key: 'cover_card',
    label: 'Card vừa (4/12)',
    description: 'Card vừa trong lưới 3 cột của danh sách tin tức',
    width: 720,
    height: 405,
    format: 'webp',
    quality: 82,
    fit: 'cover'
  },
  {
    key: 'cover_hero',
    label: 'Card lớn (6/12, nổi bật)',
    description: 'Card lớn/nổi bật (featured) đầu danh sách tin tức',
    width: 880,
    height: 550,
    format: 'webp',
    quality: 82,
    fit: 'cover'
  },
  {
    key: 'cover_detail',
    label: 'Trang chi tiết',
    description: 'Ảnh trong bài chi tiết; giữ nguyên tỷ lệ, chiều rộng tối đa 1280px',
    width: 1280,
    format: 'webp',
    quality: 85,
    fit: 'inside',
    withoutEnlargement: true
  },
  {
    key: 'cover_social',
    label: 'Chia sẻ mạng xã hội',
    description: 'og:image khi chia sẻ bài viết lên Facebook/Zalo/LinkedIn...',
    width: 1200,
    height: 630,
    format: 'jpeg',
    quality: 85,
    fit: 'cover'
  }
];

module.exports = { COVER_IMAGE_PROFILES };
